from django.core.exceptions import PermissionDenied
from django.shortcuts import render, redirect
import requests
from django.conf import settings
from django.contrib.auth import logout as django_logout
from coordinator_portal.views.error import validate_api_call
from django.core.urlresolvers import reverse
from django.contrib import messages
from coordinator_portal.forms import LoginForm
import json
import base64
import logging
from django.http import JsonResponse, HttpResponseForbidden
from coordinator_portal.views.audit import create_audit

logger = logging.getLogger(__name__)


def login_required(function):
    def wrapper(request, *args, **kw):
        try:
            if not request.session.session_key or 'role' not in request.session:
                return HttpResponseForbidden("User is not logged in")
            else:
                headers = {"authorization": request.session['auth']}
                kw['headers'] = headers
                return function(request, *args, **kw)
        except KeyError:
            django_logout(request)
            return redirect(reverse('coordinator_login'))
    return wrapper


def admin_login_required(function):
    def wrapper(request, *args, **kw):
        try:
            if not request.session.session_key or 'role' not in request.session:
                return redirect(reverse('coordinator_login') + '?next=' + request.get_full_path())
            elif request.session["role"] == 'coordinator_user':
                logger.warning("status_code={} message=Unauthorized user '{}' tried to access '{}', an admin-only feature."
                               .format(403, request.session['username'], request.path))
                return HttpResponseForbidden("Admin is not logged in")
            else:
                headers = {"authorization": request.session['auth']}
                kw['headers'] = headers
                return function(request, *args, **kw)
        except KeyError:
            django_logout(request)
            return redirect(reverse('coordinator_login'))
    return wrapper


def login(request):

    try:
        # GET requests to the page return the page itself
        if request.session.session_key and 'role' in request.session:
            if request.GET.get('next'):
                return redirect(request.GET.get('next'))
            return render(request, "coordinator_portal/app.html")

        # POST request to the page attempt to validate the credentials and log-in the user
        elif request.method == 'POST':

            form = LoginForm(request.POST)
            if form.is_valid():
                username = request.POST.get('username')
                password = request.POST.get('password')

                # Authentication API Call
                response = requests.post("{}/ad/auth".format(settings.AD_WS_URL),
                             data={"username": username, "password": password, "attributes": True})
                validate_api_call(response, [])
                response_data = json.loads(response.text)["response"]

                # If SFO AD returns a valid set of credentials
                if response_data["validPassword"] is True:

                    # And if the credentials are in the Five Star OU
                    if response_data["dn"].find("OU=FSP PPM") != -1:

                        headers = {"authorization": "Basic {}".format(base64.urlsafe_b64encode("{}:{}".format(response_data['email'], password)))}
                        response = requests.get("{}/user".format(settings.ADMIN_WS_URL), params={"email": response_data['email'].lower()},
                        headers=headers)

                        validate_api_call(response, [404])

                        # And the user is in the coordinator user table
                        if response.status_code == 200:

                            # Iterate over all users with this email
                            for response_coordinator_data in json.loads(response.text)['users']:

                                # If a coordinator is found and they're not deleted, immediately log them in
                                if not response_coordinator_data['deleted'] and (response_coordinator_data['role']['role_name'] == "coordinator_admin"
                                                                                 or response_coordinator_data['role']['role_name'] == "coordinator_user"):
                                    request.session["logged_in"] = True
                                    request.session["first_name"] = response_coordinator_data["first_name"].title()
                                    request.session["last_name"] = response_coordinator_data["last_name"].title()
                                    request.session["username"] = response_coordinator_data["email"]
                                    request.session["user_id"] = response_coordinator_data["user_id"]
                                    request.session["role"] = response_coordinator_data['role']['role_name']
                                    request.session["role_id"] = response_coordinator_data['role']['role_id']
                                    request.session["auth"] = headers['authorization']
                                    request.session["company_id"] = response_coordinator_data["company_id"]

                                    # Log that the user logged in.
                                    create_audit(request, headers, None, "USERS", "Logged in", "LOGIN", None, response_coordinator_data['email'])

                                    return render(request, "coordinator_portal/app.html", "")

                                # Otherwise alert them that they don't have authorization to use the app
                                messages.error(request, 'Only authorized coordinators may use this system.',
                                               extra_tags="danger")
                                return redirect(reverse('coordinator_login'))

                            # If there is no matching email, alert the user they're not authorized to use the app
                            messages.error(request, 'Only authorized coordinators may use this system.',
                                           extra_tags="danger")
                            return redirect(reverse('coordinator_login'))

                        # Otherwise alert the user they're a coordinator but not authorized to use the system
                        elif response.status_code == 404:
                            messages.error(request, 'Only authorized coordinators may use this system.',
                                           extra_tags="danger")
                            return redirect(reverse('coordinator_login'))

                    # Otherwise alert the user they're not authorized to use the system
                    else:
                        messages.error(request, 'You do not have authorization to use this application.', extra_tags="danger")
                        return redirect(reverse('coordinator_login'))

                # Otherwise alert the user they've entered and incorrect username/password combination.
                else:
                    messages.error(request, 'Incorrect username or password.', extra_tags="danger")
                    return redirect(reverse('coordinator_login'))

            # Otherwise alert the user that form validation failed
            else:
                messages.error(request, 'An error occurred when attempting to validate your login credentials. Please try again or contact SFO Helpdesk.', extra_tags="danger")
                return redirect(reverse('coordinator_login'))

        else:
            return render(request, "coordinator_portal/login.html", "")

    except KeyError:
        django_logout(request)
        return redirect((reverse('coordinator_login')))

@login_required
def logout(request, headers):

    # Log that the user logged out.
    create_audit(request, headers, None, "USERS",
                 "Logged out".format(request.session['username']), "LOGOUT", None, request.session['username'])

    request.session.clear()
    django_logout(request)
    return redirect((reverse('coordinator_login')))



