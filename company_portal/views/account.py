from django.shortcuts import render, redirect
from django.http import HttpResponseForbidden, HttpResponse, JsonResponse
from django.contrib.auth import logout as django_logout
from django.template import loader
from django.contrib import messages
from company_portal.models import Token_Entry
from django.conf import settings
from django.core.urlresolvers import reverse
from django.utils import timezone
from company_portal.views.error import validate_api_call
from company_portal.forms import LoginForm
import logging
import base64
import json
import requests
import uuid
import datetime
import hashlib

logger = logging.getLogger(__name__)


# Courtesy of GitHub Gist user ShawnMilo
# https://gist.github.com/ShawnMilo/7777304
def is_valid_uuid4(uuid_string):
    try:
        val = uuid.UUID(uuid_string, version=4)
    except Exception:
        return False
    except ValueError:
        return False

    return val.hex == uuid_string.replace('-', '')


def login_required(function):
    def wrapper(request, *args, **kw):
        try:
            if not request.session.session_key or 'role' not in request.session:
                return HttpResponseForbidden("User is not logged in")
            else:
                headers = {"authorization": request.session['auth'], "company_id": str(request.session['company_id'])}
                kw['headers'] = headers
                return function(request, *args, **kw)
        except KeyError:
            django_logout(request)
            return redirect(reverse('company_login'))
    return wrapper


def admin_login_required(function):
    def wrapper(request, *args, **kw):
        try:
            if not request.session.session_key or 'role' not in request.session:
                return HttpResponseForbidden("User is not logged in")
            elif not request.session['activated'] and request.session['reset_password']:
                return HttpResponseForbidden("User's account is not active")
            elif request.session["role"] == 'Driver':
                messages.error(request, "You do not have authorization to access that feature.")
                logger.warning("status_code={} message=Unauthorized user '{}' tried to access '{}', an admin-only page."
                               .format(403, request.session['username'], request.path))
                return redirect(reverse('company_login'))
            else:
                headers = {"authorization": request.session['auth'], "company_id": str(request.session['company_id'])}
                kw['headers'] = headers
                return function(request, *args, **kw)
        except KeyError:
            django_logout(request)
            return redirect(reverse('company_login'))
    return wrapper


def unlock_required(function):
    def wrapper(request, *args, **kw):
        headers = {"authorization": request.session['auth'], "company_id": str(request.session['company_id'])}
        response = requests.get("{}/user".format(settings.COMPANY_WS_URL), headers=headers)
        validate_api_call(response, [403])
        user_data = json.loads(response.text)['users'][0]

        if user_data['enabled']:
            kw['headers'] = headers
            return function(request, *args, **kw)

        else:
            return HttpResponse(status=401)
    return wrapper


def unlock_company_required(function):
    def wrapper(request, *args, **kw):
        headers = {"authorization": request.session['auth'], "company_id": str(request.session['company_id'])}
        response = requests.get("{}/company/{}".format(settings.COMPANY_WS_URL, request.session['company_id']), headers=headers)
        validate_api_call(response, [403])
        company_data = json.loads(response.text)['company'][0]
        if company_data['enabled']:
            kw['headers'] = headers
            return function(request, *args, **kw)

        else:
            return JsonResponse({"status": 'false', "reason": company_data['audit_action_reason']}, status=401)
    return wrapper


def login(request):
    try:
        # GET requests to the page return the page itself
        if request.session.session_key and 'role' in request.session and 'activated' in request.session:
            if request.session['activated']:
                if request.GET.get('next'):
                    return redirect(request.GET.get('next'))
                return render(request, "company_portal/app.html")
            else:
                return render(request, "company_portal/activate_account.html")

        # POST request to the page attempt to validate the credentials and log-in the user
        elif request.method == 'POST':

            form = LoginForm(request.POST)

            if form.is_valid():
                email = request.POST.get('username').lower()
                password = hashlib.sha256(request.POST.get('password')).hexdigest()
                company_id = request.POST.get("company_id")

                # Attempt to GET the user from the company user table
                headers = {"authorization": "Basic {}".format(base64.urlsafe_b64encode("{}:{}".format(email, password))), "company_id": str(company_id)}
                response = requests.get("{}/user".format(settings.COMPANY_WS_URL), headers=headers)
                validate_api_call(response, [403])

                # 200 implies successful login
                if response.status_code == 200:

                    data = json.loads(response.text)['users'][0]

                    # If the user's account is not deleted
                    if not data['deleted']:

                        request.session["logged_in"] = True
                        request.session["first_name"] = data["first_name"]
                        request.session["last_name"] = data["last_name"]
                        request.session["username"] = data["email"].lower()
                        request.session["user_id"] = data["user_id"]
                        request.session["role"] = data['role']['role_name']
                        request.session["role_id"] = data['role']['role_id']
                        request.session['activated'] = data['activated']
                        request.session['enabled'] = data['enabled']
                        request.session['reset_password'] = data['reset_password']
                        request.session["auth"] = headers['authorization']
                        request.session["company_id"] = data["company_id"]

                        # If the account is not activated (just created by an Landside Admin)
                        if not request.session['activated'] and request.session['reset_password']:

                            # Send them to activate their account
                            return render(request, "company_portal/activate_account.html")

                        # Redirect to next/app page
                        elif request.GET.get('next'):
                            return redirect(request.GET.get('next'))
                        return render(request, "company_portal/app.html")

                    # Otherwise don't allow the user to enter
                    else:
                        messages.error(request, 'Wrong username / password combination.')
                        response = requests.get("{}/company".format(settings.COMPANY_WS_URL))
                        validate_api_call(response, [])

                        all_companies = json.loads(response.text)['companies']
                        return redirect(reverse('company_login'), {"all_companies": all_companies})

                # 403 implies the user entered an incorrect username / password combination
                elif response.status_code == 403:
                    messages.error(request, 'Wrong username or password.')

                    response = requests.get("{}/company".format(settings.COMPANY_WS_URL))
                    validate_api_call(response, [])

                    all_companies = json.loads(response.text)['companies']
                    return redirect(reverse('company_login'), {"all_companies": all_companies})

            else:
                messages.error(request,
                               'Your login information could not be validated. Please try again or contact SFO Landside Operations.')
                response = requests.get("{}/company".format(settings.COMPANY_WS_URL))
                validate_api_call(response, [])

                all_companies = json.loads(response.text)['companies']
                return redirect(reverse('company_login'), {"all_companies": all_companies})

        # Any other request redirects to the login page regardless
        else:
            response = requests.get("{}/company".format(settings.COMPANY_WS_URL))
            validate_api_call(response, [])

            all_companies = json.loads(response.text)['companies']
            return render(request, "company_portal/login.html", {"all_companies": all_companies})

    except KeyError:
        django_logout(request)
        response = requests.get("{}/company".format(settings.COMPANY_WS_URL))
        validate_api_call(response, [])

        all_companies = json.loads(response.text)['companies']
        return redirect(reverse('company_login'), {"all_companies": all_companies})


def reset_password(request):
    if request.method == 'GET':

        # Validate the uuid token
        if is_valid_uuid4(request.GET.get("t")):

            token = uuid.UUID(request.GET.get("t")).hex

            # If the token is in the database, get it
            if Token_Entry.tokens.filter(pk=token).exists():
                reset_data = Token_Entry.tokens.get(pk=token)

                # If the token has not expired
                margin = datetime.timedelta(hours=reset_data.expires_in_hours)
                if reset_data.created_at <= timezone.now() <= reset_data.created_at + margin:
                    return render(request, "company_portal/reset_password.html", {"email": reset_data.email.lower(),
                                                                                  "company_id": reset_data.company_id,
                                                                                  "token": request.GET.get("t")})
                else:
                    messages.error(request,
                                   'Your password expiration link has expired. Please reset your password and try again.')
                    return redirect((reverse('company_login')))

        messages.error(request, 'Your password expiration link has expired. Please reset your password and try again.')
        return redirect((reverse('company_login')))

    elif request.method == 'POST':

        # Reset the user's password
        data = {"email": request.POST.get('email').lower()}
        data['company_id'] = request.POST.get('company_id')

        # SHA 256 hash the password
        data['password'] = hashlib.sha256(request.POST.get('password')).hexdigest()
        response = requests.put("{}/user/forgot-password".format(settings.COMPANY_WS_URL), data=data)
        validate_api_call(response, [])

        # Then delete their reset password authentication
        if is_valid_uuid4(request.POST.get("token")):

            token = uuid.UUID(request.POST.get("token")).hex
            if Token_Entry.tokens.filter(pk=token).exists():
                token_to_delete = Token_Entry.tokens.get(pk=token)
                token_to_delete.delete()

        messages.success(request, 'Password reset!')
        return redirect((reverse('company_login')))


def forgot_password(request):
    if request.method == 'GET':

        response = requests.get("{}/company".format(settings.COMPANY_WS_URL))
        validate_api_call(response, [])

        all_companies = json.loads(response.text)['companies']

        return render(request, "company_portal/forgot_password.html", {"all_companies": all_companies})
    elif request.method == 'POST':

        reset_email = request.POST.get('email').lower()
        company_id = request.POST.get('company_id')

        # First make an API call to see if the password is in the user table
        response = requests.get("{}/user/validate-email".format(settings.COMPANY_WS_URL), params={"email": reset_email, "company_id": company_id})
        validate_api_call(response, [404])

        if response.status_code == 200:

            user_info = json.loads(response.text)['users'][0]

            if user_info['activated']:

                # If it is, send off an email to reset the password
                url = "https://sharedridevans.flysfo.com/company/reset_password"
                if settings.BUILD_ENV == "LOCAL":
                    url = "127.0.0.1:8000/company/reset_password"
                elif settings.BUILD_ENV == "DEV":
                    url = "dev-srv.flysfo.com/company/reset_password"
                elif settings.BUILD_ENV == "QA":
                    url = "https://qa-srv.flysfo.com/company/reset_password"
                elif settings.BUILD_ENV == "STG":
                    url = "https://stg-sharedridevans.flysfo.com/company/reset_password"

                # Attempt to create the token entry in the token table

                # Create a random primary key (uuid)
                new_uuid = uuid.uuid4()

                # Continue to make new uuids until a unique uuid is generated (should not run more than once)
                while Token_Entry.tokens.filter(pk=new_uuid).exists():
                    new_uuid = uuid.uuid4()

                # A unique uuid was created, so now store the reset password entry in the database
                token = Token_Entry(uuid=new_uuid, email=reset_email, company_id=company_id, expires_in_hours=settings.TOKEN_EXPIRE_TIME_HOURS)
                token.save()

                # Construct the url and email to send out
                url = url+"?t="+str(new_uuid)

                email_data = {"from": "noreply-sharedridevans@flysfo.com"}
                email_data['to'] = reset_email
                email_data['isHtml'] = True
                email_data['subject'] = "Shared Ride Vans - Reset Password"
                email_raw = loader.render_to_string('company_portal/forgot_password_email.html',
                                                    {"name": user_info['first_name'] + " " + user_info['last_name'],
                                                     "url": url})
                email_data['message'] = email_raw

                # Then send the email with the url
                response = requests.post("{}/email".format(settings.EMAIL_WS_URL),
                                         files=(('test', 'email'), ('test2', 'email2')), data=email_data, headers=settings.SERVICE_AUTH_HEADER)
                validate_api_call(response, [])
                messages.success(request, 'Reset password request accepted! Check your email for your password reset link.')
                return redirect((reverse('company_login')))

            else:
                messages.error(request, 'You must activate your account before you can reset your password!')
                return redirect((reverse('company_login')))
        messages.success(request, 'Reset password request accepted! If your email is registered with Shared Rides, you will recieve an email with your password reset link.');
        return redirect((reverse('company_login')))


@login_required
def activate(request, headers):
    if request.method == 'GET':
        return render(request, "company_portal/activate_account.html")
    elif request.method == 'POST':

        new_password = request.POST.get('new_password')
        if new_password == request.POST.get('confirm_password'):

            # Make activate account API call
            data = {"password":  hashlib.sha256(new_password).hexdigest()}
            data['email'] = request.session['username']
            data['company_id'] = request.session['company_id']
            response = requests.put("{}/user/activate-user".format(settings.COMPANY_WS_URL), data=data, headers=headers)
            validate_api_call(response, [])

            # Once the call succeeds, correct their session information and log them in

            request.session['activated'] = True
            request.session['reset_password'] = False
            request.session['auth'] = "Basic {}".format(base64.urlsafe_b64encode("{}:{}".format(data['email'], data['password'])))

            return redirect((reverse('company_login')))

        else:
            messages.error(request,
                           'Your activation password could not be validated. Please try again or contact SFO Landside Operations.')
            return render(request, "company_portal/activate_account.html", "")


def logout(request):
    request.session.clear()
    django_logout(request)
    return redirect((reverse('company_login')))