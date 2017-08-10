from django.shortcuts import render, redirect, render_to_response
from django.core.urlresolvers import reverse
from django.conf import settings
from django.contrib import messages
from django.http import Http404, JsonResponse, HttpResponse, HttpResponseNotAllowed
from django.template import loader
from admin_portal.views.error import validate_api_call
from admin_portal.views.provider import create_audit
from admin_portal.views.login import login_required
from provider import password_generator
import requests
import json
import logging
import hashlib


logger = logging.getLogger(__name__)

# GET: Returns a user for a given user_id
@login_required
def get_user(request, provider_id, user_id, headers):
    if request.method == "GET":
        response = requests.get("{}/user/{}".format(settings.ADMIN_WS_URL, user_id), headers=headers)
        validate_api_call(response, [])
        data = json.loads(response.text)['users'][0]
        return JsonResponse(data, safe=False)
    else:
        return HttpResponseNotAllowed(['GET'])


# GET: Returns a list of users under a given role name (currently only superuser)
@login_required
def get_all_users(request, provider_id, headers):
    if request.method == "GET":

        if request.GET.get("type") == "superuser":

            # Get the ID corresponding to 'superuser'
            response = requests.get("{}/reference/role".format(settings.ADMIN_WS_URL), headers=headers)
            validate_api_call(response, [])
            all_roles = json.loads(response.text)['roles']
            super_user_role_id = -1
            for role in all_roles:
                if role['role_name'] == "superuser":
                    super_user_role_id = role['role_id']
                    break

            # Get All Provider Users
            # TO-DO Specify role_name in parameters
            parameters = {"role_id": super_user_role_id, "company_id": provider_id}
            response = requests.get("{}/user".format(settings.ADMIN_WS_URL), params=parameters, headers=headers)
            validate_api_call(response, [])
            data = json.loads(response.text)['users']
            return JsonResponse(data, safe=False)

        elif request.GET.get("type") == "driver":
            return NotImplemented

    else:
        return HttpResponseNotAllowed(['GET'])


# POST: Creates a superuser and sends out an activation email
@login_required
def create_user(request, provider_id, headers):
    if request.method == 'POST':

        # Get the new user from the form post
        new_user = json.loads(json.dumps(request.POST))

        # Get the Super User Role
        response = requests.get("{}/reference/role".format(settings.ADMIN_WS_URL), headers=headers)
        validate_api_call(response, [])
        all_roles = json.loads(response.text)['roles']
        super_user_role_id = 0
        for role in all_roles:
            if role['role_name'] == "superuser":
                super_user_role_id = role['role_id']
                break

        # Get the Company Name
        response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), headers=headers)
        validate_api_call(response, [])
        company = json.loads(response.text)['companies'][0]

        # Assert super_user_role_id is NOT 0
        # Then construct the super user object for posting
        temp_password = password_generator()
        data = {'first_name': new_user['first_name']}
        data['last_name'] = new_user['last_name']
        data['email'] = new_user['email'].lower()
        data['password'] = hashlib.sha256(temp_password).hexdigest()
        data['phone_number'] = new_user['phone']
        data['enabled'] = True
        data['deleted'] = False
        data['activated'] = False
        data['reset_password'] = True
        data['created_by'] = request.session['username']
        data['company_id'] = provider_id
        data['role_id'] = super_user_role_id
        response = requests.post("{}/user".format(settings.ADMIN_WS_URL), data=data, headers=headers)
        validate_api_call(response, [409])

        # If the user already exists, then get the user id of the failed user and PUT the new data if user is deleted
        if response.status_code == 409:

            response = requests.get("{}/user".format(settings.ADMIN_WS_URL),
                                    params={"email": data['email'], "company_id": provider_id, "include_deleted": True}, headers=headers)
            validate_api_call(response, [])
            conflicting_user = json.loads(response.text)['users'][0]
            if conflicting_user['deleted']:
                new_user_id = conflicting_user['user_id']
                updated_data = data
                updated_data['updated_by'] = request.session['username']
                updated_data['role_id'] = super_user_role_id
                response = requests.put("{}/user/{}".format(settings.ADMIN_WS_URL, new_user_id), data=updated_data, headers=headers)
                validate_api_call(response, [])

                create_audit(request, headers, None, "USERS",
                             "Created provider user '{} {}' under provider '{}'".format(
                                 data['first_name'], data['last_name'], company['company_name']), "ADD", provider_id,
                             data['email'].lower())

                return resend_user_activation(request, provider_id, conflicting_user['user_id'])

            else:
                logger.warning("status_code={} message=Failed to create user {} because active email-company-id pattern exists."
                               .format(409, data['first_name']+" "+data['last_name']))
                return HttpResponse(status=409)
        else:
            create_audit(request, headers, None, "USERS", "Created provider user '{} {}' under provider '{}'".format(
                data['first_name'], data['last_name'], company['company_name']), "ADD", provider_id, data['email'].lower())

            create_user_activation(request, headers, new_user['first_name'], new_user['last_name'], new_user['email'].lower(), temp_password)

            messages.success(request, "User Created")
            return redirect('edit_provider', provider_id)
    else:
        return HttpResponseNotAllowed(['POST'])


# POST: Updates a user for a given user id
@login_required
def edit_user(request, provider_id, user_id, headers):

    if request.method == 'POST':

        # Get the new user from the form post
        new_user = json.loads(json.dumps(request.POST))

        # Get the old user from the database
        response = requests.get("{}/user/{}".format(settings.ADMIN_WS_URL, user_id), headers=headers)
        validate_api_call(response, [])
        old_user = json.loads(response.text)['users'][0]

        data = {"user_id": user_id}
        data['first_name'] = new_user['first_name']
        data['last_name'] = new_user['last_name']
        data['email'] = new_user['email'].lower()
        data['phone_number'] = new_user['phone']
        data['enabled'] = old_user['enabled']
        data['deleted'] = old_user['deleted']
        data['activated'] = old_user['activated']
        data['reset_password'] = old_user['reset_password']
        data['updated_by'] = request.session['username']
        data['company_id'] = old_user['company_id']
        data['role_id'] = old_user['role']['role_id']

        response = requests.put("{}/user/{}".format(settings.ADMIN_WS_URL, user_id), data=data, headers=headers)
        validate_api_call(response, [409])

        if response.status_code == 409:
            logger.warning("status_code={} message=Failed to edit user {} because email-company-id pattern exists."
                           .format(409, data['first_name'] + " " + data['last_name']))
            return HttpResponse(status=409)

        create_audit(
            request, headers, None, "USERS", "Edited provider user '{} {}'".format(
                data['first_name'], data['last_name']), "UPDATE", provider_id, data['email'].lower())

        messages.success(request, "User Updated")
        return redirect('edit_provider', provider_id)
    else:
        return HttpResponseNotAllowed(['POST'])


# POST: Locks a user
@login_required
def lock_user(request, provider_id, user_id, headers):

    if request.method == 'POST':

        # Get the new user from the form post
        lock_form = json.loads(json.dumps(request.POST))

        # Get the user and their company
        response = requests.get("{}/user/{}".format(settings.ADMIN_WS_URL, user_id), headers=headers)
        validate_api_call(response, [])
        user = json.loads(response.text)['users'][0]

        response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), headers=headers)
        validate_api_call(response, [])
        company = json.loads(response.text)['companies'][0]

        data = {'user_id': user_id}
        if lock_form['lock_type'] == "lock":
            data['enabled'] = False
        else:
            data['enabled'] = True
        data['updated_by'] = request.session['username']

        response = requests.put("{}/user/{}/lock".format(settings.ADMIN_WS_URL, user_id), data=data, headers=headers)
        validate_api_call(response, [])

        # Make audit call after lock/unlock was successful
        if lock_form['lock_type'] == "lock":
            create_audit(request, headers, None, "USERS", "Locked provider user '{} {}' under provider '{}'".format(
                user['first_name'], user['last_name'], company['company_name']), "UPDATE", provider_id, None)
        else:
            create_audit(request, headers, None, "USERS", "Unlocked provider user '{} {}' under provider '{}'".format(
                user['first_name'], user['last_name'], company['company_name']), "UPDATE", provider_id, None)

        return redirect('edit_provider', provider_id)
    else:
        return HttpResponseNotAllowed(['POST'])


# POST: Deletes a user
@login_required
def delete_user(request, provider_id, user_id, headers):
    if request.method == 'POST':

        # Get the delete form from the POST request
        delete_form = json.loads(json.dumps(request.POST))

        # Get the user and their company
        response = requests.get("{}/user/{}".format(settings.ADMIN_WS_URL, user_id), headers=headers)
        validate_api_call(response, [])
        user = json.loads(response.text)['users'][0]

        response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), headers=headers)
        validate_api_call(response, [])
        company = json.loads(response.text)['companies'][0]

        data = {'user_id': user_id}
        data['updated_by'] = request.session['username']

        response = requests.delete("{}/user/{}".format(settings.ADMIN_WS_URL, user_id), data=data, headers=headers)
        validate_api_call(response, [])

        create_audit(request, headers, None, "USERS", "Deleted provider user '{} {}' under provider '{}'".format(
                user['first_name'], user['last_name'], company['company_name']), "DELETE", provider_id, None)

        messages.success(request, "User Deleted")
        return redirect('edit_provider', provider_id)
    else:
        return HttpResponseNotAllowed(['POST'])


# DEPRECATED!
# POST: Validates that a user's email does not exist in the database
@login_required
def validate_user_email(request, headers):
    if request.method == "POST":
        new_user_email = json.loads(json.dumps(request.POST))['email'].lower()
        response = requests.get("{}/user".format(settings.ADMIN_WS_URL), headers=headers)
        all_srv_users = json.loads(response.text)['users']

        for user in all_srv_users:
            if user['email'] == new_user_email:
                return HttpResponse(status=409)

        return HttpResponse(status=200)
    else:
        return HttpResponseNotAllowed(['POST'])


# Constructs the activation email and sends it out to the given email
def create_user_activation(request, headers, first, last, email, temp_password):

    # Send the email
    url = "https://sharedridevans.flysfo.com/company/"
    if settings.BUILD_ENV == "LOCAL":
        url = "127.0.0.1:8000/company/"
    elif settings.BUILD_ENV == "DEV":
        url = "dev-srv.flysfo.com/company/"
    elif settings.BUILD_ENV == "QA":
        url = "https://qa-srv.flysfo.com/company/"
    elif settings.BUILD_ENV == "STG":
        url = "https://stg-sharedridevans.flysfo.com/company/"

    email_data = {"from": "noreply-sharedridevans@flysfo.com"}
    email_data['to'] = email.lower()
    email_data['isHtml'] = True
    email_data['subject'] = "Shared Ride Vans - Account Activation"
    email_raw = loader.render_to_string('admin_portal/account/email.html',
                                        {"name": first + " " + last,
                                         "temporary_pass": temp_password, "url": url})
    email_data['message'] = email_raw
    response = requests.post("{}/email".format(settings.EMAIL_WS_URL), files=(('test', 'email'), ('test2', 'email2')),
                             data=email_data, headers=headers)
    validate_api_call(response, [])


# POST: Reconstructs/sends the user's activation email and updates their temporary password
@login_required
def resend_user_activation(request, provider_id, user_id, headers):
    if request.method == 'POST':

        # Get the user by their id
        response = requests.get("{}/user/{}".format(settings.ADMIN_WS_URL, user_id), headers=headers)
        validate_api_call(response, [])
        user_data = json.loads(response.text)['users'][0]

        # First generate a new password
        temp_password = password_generator()
        data = {"password": hashlib.sha256(temp_password).hexdigest()}
        data['updated_by'] = request.session['username']

        # Update the temp password
        response = requests.put("{}/user/{}/password".format(settings.ADMIN_WS_URL, user_id), data=data, headers=headers)
        validate_api_call(response, [])

        # Send the new email
        url = "https://sharedridevans.flysfo.com/company/"
        if settings.BUILD_ENV == "LOCAL":
            url = "127.0.0.1:8000/company/"
        elif settings.BUILD_ENV == "DEV":
            url = "dev-srv.flysfo.com/company/"
        elif settings.BUILD_ENV == "QA":
            url = "https://qa-srv.flysfo.com/company/"
        elif settings.BUILD_ENV == "STG":
            url = "https://stg-sharedridevans.flysfo.com/company/"

        email_data = {"from": "noreply-sharedridevans@flysfo.com"}
        email_data['to'] = user_data['email'].lower()
        email_data['isHtml'] = True
        email_data['subject'] = "Shared Ride Vans - Account Activation"
        email_raw = loader.render_to_string('admin_portal/account/email.html',
                                            {"name": user_data['first_name'] + " " + user_data['last_name'],
                                             "temporary_pass": temp_password, "url": url})
        email_data['message'] = email_raw
        response = requests.post("{}/email".format(settings.EMAIL_WS_URL),
                                 files=(('test', 'email'), ('test2', 'email2')),
                                 data=email_data, headers=headers)
        validate_api_call(response, [])

        messages.success(request, "Account activation email resent!")
        return redirect('edit_provider', provider_id)

    else:
        return HttpResponseNotAllowed(['POST'])



