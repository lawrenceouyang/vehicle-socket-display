from django.contrib.auth import logout as django_logout
from django.contrib import messages
from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from django.conf import settings
from django.views.decorators.cache import cache_control
from django.http import JsonResponse, HttpResponseServerError
from admin_portal.forms import LoginForm
from admin_portal.views.error import validate_api_call
import requests
import json
import logging
import base64

logger = logging.getLogger(__name__)


def login_required(function):
    def wrapper(request, *args, **kw):
        try:
            if not request.session.session_key or 'role' not in request.session is None:
                return redirect(reverse('admin_login') + '?next=' + request.get_full_path())
            else:
                headers = {"authorization": request.session['auth']}
                kw['headers'] = headers
                return function(request, *args, **kw)
        except KeyError:
            django_logout(request)
            return redirect(reverse('admin_login') + '?next=' + request.get_full_path())
    return wrapper


def login(request):
    try:
        # Redirect to Home if session is already valid
        if request.session.session_key and 'role' in request.session and 'auth' in request.session:
            if request.GET.get('next'):
                return redirect(request.GET.get('next'))
            return render(request, "admin_portal/main/home.html", "")

        # Login POST
        elif request.method == 'POST':

            form = LoginForm(request.POST)

            # Ensure login form parameters are valid
            if form.is_valid():
                username = request.POST.get('username')
                password = request.POST.get('password')

                # Authentication API Call
                response = requests.post("{}/ad/auth".format(settings.AD_WS_URL), data={"username": username, "password": password, "attributes": True})
                validate_api_call(response, [])
                response_data = json.loads(response.text)["response"]

                # If SFO AD returns a valid set of credentials
                if response_data["validPassword"] is True:

                    # And if the credentials have a Landside OU
                    if response_data["dn"].find("OU=Trans Op") != -1:

                        # Fill session metadata
                        request.session["logged_in"] = True
                        request.session["first_name"] = response_data["firstName"].title()
                        request.session["last_name"] = response_data["lastName"].title()
                        request.session["username"] = username
                        request.session["id"] = response_data["id"]
                        request.session["role"] = 'Admin'
                        request.session["auth"] = "Basic {}".format(base64.urlsafe_b64encode("{}:{}".format
                                                                                              (username, password)))

                        # Get the role_id for a landside admin
                        response = requests.get("{}/reference/role".format(settings.ADMIN_WS_URL),
                                                headers={"authorization": request.session['auth']})
                        role_list = json.loads(response.text)['roles']
                        for role in role_list:
                            if role['role_name'] == "landside_admin":
                                request.session["role_id"] = role['role_id']
                                break

                        # Redirect to next/home page
                        if request.GET.get('next'):
                            return redirect(request.GET.get('next'))
                        return redirect(reverse('admin_login'))

                    # Otherwise no Landside OU or incorrect OU implies unauthorized access
                    else:
                        logger.warning("status_code={} message=Unauthorized user {} attempted to login."
                           .format(403, username))
                        messages.error(request, "You do not have authorization to access this system.",
                           extra_tags="danger")
                        return redirect(reverse('admin_login'))

                # Otherwise the user entered bad credentials
                else:
                    messages.error(request, 'Wrong username or password.', extra_tags="danger")
                    return render(request, "admin_portal/account/login.html", "")

            # Otherwise alert the user that they're form submission couldn't be validated
            else:
                messages.error(request, 'Your login information could not be validated. Please try again or contact SFO Helpdesk.', extra_tags="danger")
                return render(request, "admin_portal/account/login.html", "")
        else:
            return render(request, "admin_portal/account/login.html", "")

    except KeyError:
        django_logout(request)
        return redirect(reverse('admin_login'))


def logout(request):
    request.session.clear()
    django_logout(request)
    return redirect(reverse('admin_login'))