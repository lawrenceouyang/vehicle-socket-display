from django.shortcuts import render, redirect
from django.core.urlresolvers import reverse
from django.conf import settings
from django.contrib import messages
from django.http import Http404, JsonResponse, HttpResponseNotAllowed
from admin_portal.views.error import validate_api_call
from admin_portal.views.login import login_required
from django.template import loader
from admin_portal.forms import form_is_valid, CreateProviderForm
from datetime import datetime, timedelta
import requests
import json
import logging
import unicodedata
import string
import random
import time
import hashlib

logger = logging.getLogger(__name__)

MAX_COMPANIES_ALLOWED = 5


# Generates a random password consisting of 'chars' and length of 'size'
def password_generator(size=8, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))


# Returns the action id (integer) for a given action string
# If the action is not found, returns None (null)
def get_action_id(headers, action_name):
    response = requests.get("{}/reference/action".format(settings.ADMIN_WS_URL), headers=headers)
    validate_api_call(response, [])
    for action in json.loads(response.text)['actions']:
        if action['action_name'] == action_name:
            return action['action_id']


# Return the user role (integer) for a given role string
# If the role is not found, returns None (null)
def get_user_role_id(headers, user_role_name):
    response = requests.get("{}/reference/role".format(settings.ADMIN_WS_URL), headers=headers)
    validate_api_call(response, [])
    all_roles = json.loads(response.text)['roles']
    for role in all_roles:
        if role['role_name'] == user_role_name:
            return role['role_id']


# Returns a list of all company serviceable destinations for a given company id
# If the company does not exist, returns None (null)
def get_all_company_destinations(headers, provider_id):
    response = requests.get("{}/company/{}/company_destination".format(settings.ADMIN_WS_URL, provider_id), params={"include_deleted": True}, headers=headers)
    validate_api_call(response, [])
    return json.loads(response.text)['company_destinations']


# Inserts an audit record into the audit table to be viewable on the admin portal
def create_audit(request, headers, action_reason, resource_name, action_description,
                 action_name, company_id, action_on_user):
    data = {"action_id": get_action_id(headers, action_name)}
    data['company_id'] = company_id
    data['action_description'] = action_description
    data['action_by_user_role_id'] = request.session['role_id']
    data['action_by_user'] = request.session['username']
    data['resource_name'] = resource_name
    data['action_reason'] = action_reason
    data['action_on_user'] = action_on_user

    response = requests.post(
        "{}/audit".format(settings.COORDINATOR_WS_URL), data=data, headers=headers)
    validate_api_call(response, [])

# GET: Returns the Django Template for 'Create Provider' if there are < MAX_COMPANIES_ALLOWED companies in the system
# POST: Creates a new Shared Rides provider and a new provider user if the form submitted a user
@login_required
def create_provider(request, headers):
    try:
        # GET the create a provider page
        if request.method == "GET":

            # Get a list of all Shared Ride Van companies
            response = requests.get("{}/company".format(settings.ADMIN_WS_URL), params={"include_deleted": True}, headers=headers)
            validate_api_call(response, [])
            shared_ride_companies = json.loads(response.text)

            # Determine the amount of active providers
            active_companies = 0
            for company in shared_ride_companies['companies']:
                if not company['deleted']:
                    active_companies += 1

            # As long as there are fewer than MAX_COMPANIES_ALLOWED
            if active_companies < MAX_COMPANIES_ALLOWED:

                # Get a list of all destinations
                response = requests.get("{}/reference/destination".format(settings.ADMIN_WS_URL), headers=headers)
                validate_api_call(response, [])
                all_destinations = json.loads(response.text)

                # Get a list of all GTMS companies
                response = requests.get("{}/gtms/company".format(settings.ADMIN_WS_URL), headers=headers)
                validate_api_call(response, [])
                gtms_companies = json.loads(response.text)


                # Extract the company ids out of every Shared Ride Company for comparison on the template side
                shared_ride_company_ids = []
                for company in shared_ride_companies['companies']:
                    shared_ride_company_ids.append(company['company_id'])

                return render(request, "admin_portal/provider/create_provider.html", {"gtms_companies": gtms_companies['gtms_companies'],
                              "shared_ride_company_ids": shared_ride_company_ids, "all_destinations": all_destinations['destinations']})

            else:
                messages.error(
                    request, "Shared Ride Vans may only support {} active providers. To add a new provider, please delete an existing active provider. ".format(MAX_COMPANIES_ALLOWED), extra_tags="danger")
                logger.error(
                    "Validation Error: User attempted to add more than allowed providers; user agent: {}".format(
                        request.META['HTTP_USER_AGENT']))
                return redirect(reverse('admin_login'))

        # POST a new provider
        elif request.method == 'POST':

            # Get all the required information from the request.POST
            data = json.loads(json.dumps(request.POST))
            data['curbside_terminals'] = request.POST.getlist("curbside")
            data['destination_ids'] = request.POST.getlist("destinations")
            data['company_id'] = data['company_id_name'].split(',', 1)[0]
            data['company_name'] = data['company_id_name'].split(',', 1)[1]

            # Create the provider (without audit_action_reason)
            create_provider_data = {'company_id': data['company_id']}
            create_provider_data['company_name'] = data['company_name']
            create_provider_data['display_name'] = data['display']
            create_provider_data['wheelchair'] = (data['wheelchair'] == "Yes")
            create_provider_data['enabled'] = True
            create_provider_data['deleted'] = False
            create_provider_data['created_by'] = request.session['username']
            response = requests.post("{}/company".format(settings.ADMIN_WS_URL), data=create_provider_data, headers=headers)
            validate_api_call(response, [])

            # Create the provider's contact information

            # Website
            website_data = {'company_id': data['company_id']}
            website_data['contact_info'] = data['website']
            website_data['contact_type'] = 'website'
            website_data['enabled'] = True
            website_data['created_by'] = request.session['username']
            response = requests.post("{}/company/{}/contact".format(settings.ADMIN_WS_URL, data['company_id']), data=website_data, headers=headers)
            validate_api_call(response, [])

            # Phone Number
            phone_data = {'company_id': data['company_id']}
            phone_data['contact_info'] = data['phone']
            phone_data['contact_type'] = 'phone_number'
            phone_data['enabled'] = True
            phone_data['created_by'] = request.session['username']
            response = requests.post("{}/company/{}/contact".format(settings.ADMIN_WS_URL, data['company_id']),data=phone_data, headers=headers)
            validate_api_call(response, [])


            # Create the provider destinations
            destination_data = {'company_id': data['company_id']}
            destination_data['created_by'] = request.session['username']
            for destination in data['destination_ids']:
                destination_data['destination_id'] = destination
                response = requests.post("{}/company/{}/company_destination".format(
                    settings.ADMIN_WS_URL, data['company_id']), data=destination_data, headers=headers)
                validate_api_call(response, [])


            # Create the provider curbside check-ins
            curbside_data = {'company_id': data['company_id']}
            curbside_data['enabled'] = True
            curbside_data['created_by'] = request.session['username']
            for terminal in data['curbside_terminals']:
                curbside_data['terminal'] = terminal
                response = requests.post("{}/company/{}/curbside".format(
                    settings.ADMIN_WS_URL, data['company_id']), data=curbside_data, headers=headers)
                validate_api_call(response, [])

            # Create audit entry of company creation
            create_audit(request, headers, None, "COMPANY", "Created provider '{}'".format(data['company_name']),
                         "ADD", data['company_id'], None)

            # Create the first superuser (if all fields were entered)
            if data['su_first'] and data['su_last'] and data['su_email'] and data['su_phone']:

                # First get the correct role ID from the reference table for superuser
                response = requests.get("{}/reference/role".format(settings.ADMIN_WS_URL), headers=headers)
                validate_api_call(response, [])
                all_roles = json.loads(response.text)['roles']
                super_user_role_id = 0
                for role in all_roles:
                    if role['role_name'] == "superuser":
                        super_user_role_id = role['role_id']
                        break

                # Assert super_user_role_id is NOT 0
                # Then construct the super user object for posting
                temp_password = password_generator()
                su_data = {'first_name': data['su_first']}
                su_data['last_name'] = data['su_last']
                su_data['email'] = data['su_email'].lower()
                su_data['password'] = hashlib.sha256(temp_password).hexdigest()
                su_data['phone_number'] = data['su_phone']
                su_data['enabled'] = True
                su_data['deleted'] = False
                su_data['activated'] = False
                su_data['reset_password'] = True
                su_data['created_by'] = request.session['username']
                su_data['company_id'] = data['company_id']
                su_data['role_id'] = super_user_role_id
                response = requests.post("{}/user".format(settings.ADMIN_WS_URL), data=su_data, headers=headers)
                validate_api_call(response, [])

                # Send the account activation email

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
                email_data['to'] = data['su_email'].lower()
                email_data['isHtml'] = True
                email_data['subject'] = "Shared Ride Vans - Account Activation"
                email_raw = loader.render_to_string('admin_portal/account/email.html',
                                                    {"name": data['su_first'] + " " + data['su_last'],
                                                     "temporary_pass": temp_password, "url": url})
                email_data['message'] = email_raw
                response = requests.post("{}/email".format(settings.EMAIL_WS_URL),
                                         files=(('test', 'email'), ('test2', 'email2')), data=email_data,
                                         headers=headers)
                validate_api_call(response, [])

                # Create audit entry of super user creation
                create_audit(
                    request, headers, None, "USERS", "Created provider user '{} {}' under provider '{}'".format(
                        data['su_first'], data['su_last'], data['company_name']), "ADD", data['company_id'],
                    data['su_email'].lower())


            # Let the display know we created a company
            display_response = requests.get("{}/display/company/{}".format(settings.COORDINATOR_WS_URL, data['company_id']))

            # Validate the call but don't stop execution if it fails
            validate_api_call(display_response, [400, 404, 500, 403, 409])

            messages.success(request, "Successfully created provider!")
            return redirect(reverse('admin_login'))

        # Otherwise redirect to home page
        else:
            return redirect(reverse('admin_login'))

    except KeyError:
        return redirect(reverse('admin_login'))

# GET: Returns the Django Template for 'View Provider'
@login_required
def view_provider(request, provider_id, headers):
    if request.method == "GET":

        # Get a list of all active providers
        response = requests.get("{}/company".format(settings.ADMIN_WS_URL), headers=headers)
        validate_api_call(response, [])
        all_companies = json.loads(response.text)['companies']
        can_restore = False
        if len(all_companies) < MAX_COMPANIES_ALLOWED:
            can_restore = True

        # Get Provider Information
        parameters = {"company_contact_info": "true", "curbside_check_in_info": "true", "company_destination_info": "true"}
        response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), params=parameters, headers=headers)
        validate_api_call(response, [])

        data = json.loads(response.text)['companies'][0]

        # Extract contact information to the first level
        phone_numbers = []
        for contact_method in data['company_contacts']:

            # Website contact object is brought up to the key "company_website"
            if contact_method['contact_type'] == "website":
                data['company_website'] = contact_method

            # All phone number objects are brought up to the list "company_phone_numbers"
            elif contact_method['contact_type'] == "phone_number":
                phone_numbers.append(contact_method)

        phone_numbers = json.dumps(phone_numbers)

        return render(request, "admin_portal/provider/view_provider.html", {"provider": data,
                                                                            "company_phone_numbers": phone_numbers,
                                                                            "can_restore": can_restore })
    else:
        return redirect(reverse('admin_login'))


# GET: Returns the Django Template 'View All Providers'
@login_required
def view_all_provider(request, headers):
    if request.method == 'GET':
        return render(request, "admin_portal/provider/view_all_provider.html")
    else:
        return redirect(reverse('admin_login'))

# GET: Returns the Django Template 'Edit Provider' for a given provider_id
# POST: Updates the provider's information from the form POST
@login_required
def edit_provider(request, provider_id, headers):

    if request.method == "GET":

        # Get Provider Information
        parameters = {"company_contact_info": "true", "curbside_check_in_info": "true",
                      "company_destination_info": "true"}
        response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), params=parameters,
                                headers=headers)
        validate_api_call(response, [])
        data = json.loads(response.text)['companies'][0]

        if not data['deleted']:

            # Get all the destinations
            response = requests.get("{}/reference/destination".format(settings.ADMIN_WS_URL), headers=headers)
            validate_api_call(response, [])
            all_destinations = json.loads(response.text)['destinations']


            # Extract destinations to the first level
            company_destination_ids = []
            for company_destination in data['company_destinations']:
                company_destination_ids.append(company_destination['destination']['destination_id'])

            # Extract curbside check-ins to the first level
            all_curbside_checkins = ["Terminal 1", "Terminal 2", "Terminal 3", "Int'l Terminal"]
            company_curbside_checkins = []
            for checkin in all_curbside_checkins:
                found = False
                for company_checkin in data['curbside_check_ins']:
                    if checkin == company_checkin['terminal']:
                        company_curbside_checkins.append({'terminal': checkin, 'selected': True, "id": company_checkin['curbside_check_in_id']})
                        found = True
                        break
                if not found:
                    company_curbside_checkins.append({'terminal': checkin, 'selected': False, "id": -1})

            # Extract contact information to the first level
            phone_numbers = []
            for contact_method in data['company_contacts']:

                # Website contact object is brought up to the key "company_website"
                if contact_method['contact_type'] == "website":
                    data['company_website'] = contact_method

                # All phone number objects are brought up to the list "company_phone_numbers"
                elif contact_method['contact_type'] == "phone_number":
                    phone_numbers.append(contact_method)

            phone_numbers = json.dumps(phone_numbers)

            return render(request, "admin_portal/provider/edit_provider.html",
                          {"provider": data, "company_phone_numbers": phone_numbers,
                           "all_destinations": all_destinations, "company_destination_ids": company_destination_ids,
                            "company_curbside_checkins": company_curbside_checkins})

        else:
            messages.error(request, "You cannot edit a deleted provider.", extra_tags="danger")
            logger.error(
                "User Error: User attempted to edit a deleted provider under user agent: {}".format(
                    request.META['HTTP_USER_AGENT']))
            return redirect('view_provider', data['company_id'])

    elif request.method == "POST":

        # Get all the form information from the POST
        new_provider = json.loads(json.dumps(request.POST))
        new_provider['curbside_terminals'] = request.POST.getlist("curbside")
        new_provider['destination_location'] = request.POST.getlist("destination")
        new_provider['phone_inputs'] = json.loads(request.POST.get("phone_input"))

        # Get all the old provider information
        parameters = {"company_contact_info": "true", "curbside_check_in_info": "true",
                      "company_destination_info": "true"}
        response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), params=parameters,
                                headers=headers)
        validate_api_call(response, [])
        old_provider = json.loads(response.text)['companies'][0]

        data = {'company_name': old_provider['company_name']}
        data['enabled'] = old_provider['enabled']
        data['deleted'] = old_provider['deleted']
        data['updated_by'] = request.session['username']
        data['display_name'] = old_provider['display_name']
        data['wheelchair'] = old_provider['wheelchair']

        changed_wheelchair = False
        changed_display_name = False

        # Update wheelchair if it changed
        if old_provider['wheelchair'] != (new_provider['wheelchair'] in ['true']):  # Hack to alias booleans as strings
            data['wheelchair'] = not(old_provider['wheelchair'])
            changed_wheelchair = True

        if old_provider['display_name'] != new_provider['display']:
            data['display_name'] = new_provider['display']
            changed_display_name = True

        response = requests.put("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), data=data,
                                headers=headers)
        validate_api_call(response, [])

        # Only make an audit call for wheelchair/display name if the call was successful
        if changed_wheelchair:
            create_audit(request, headers, None, "COMPANY", "Updated provider '{}' wheelchair accessibility to '{}'".format(old_provider['company_name'], str(data['wheelchair'])),
                     "UPDATE", provider_id, None)

        if changed_display_name:
            create_audit(request, headers, None, "COMPANY",
                         "Updated provider '{}' display name to '{}'".format(old_provider['company_name'], data['display_name']), "UPDATE", provider_id, None)

        # Let the display know we did an update to the company information
        display_response = requests.get("{}/display/company/{}".format(settings.COORDINATOR_WS_URL, provider_id))

        # Validate the call but don't stop execution if it fails
        validate_api_call(display_response, [400, 404, 500, 403, 409])

        # Update website if it changed
        for contact in old_provider['company_contacts']:
            if contact['contact_type'] == "website" and contact['contact_info'] != new_provider['website']:

                data = {'contact_info': new_provider['website']}
                data['contact_type'] = contact['contact_type']
                data['enabled'] = contact['enabled']
                data['updated_by'] = request.session['username']

                response = requests.put("{}/company/{}/contact/{}".format(settings.ADMIN_WS_URL, provider_id, contact['company_contact_id']), data=data,
                                        headers=headers)
                validate_api_call(response, [])
                create_audit(request, headers, None, "COMPANY_CONTACT", "Updated provider '{}' website to '{}'".format(
                    old_provider['company_name'], data['contact_info']), "UPDATE", provider_id, None)

        # Add New Phone Numbers
        for new_number in new_provider['phone_inputs']:
            if new_number['id'] == -1:

                data = {'contact_info': new_number['text']}
                data['contact_type'] = "phone_number"
                data['enabled'] = False
                data['created_by'] = request.session['username']

                response = requests.post("{}/company/{}/contact".format(settings.ADMIN_WS_URL, provider_id), data=data,
                                        headers=headers)
                validate_api_call(response, [])
                create_audit(request, headers, None, "COMPANY_CONTACT", "Added new contact phone number '{}' under provider '{}'".format(
                    data['contact_info'], old_provider['company_name']), "ADD", provider_id, None)

        # Delete Old Phone Numbers
        for old_number in old_provider['company_contacts']:
            found = False
            for new_number in new_provider['phone_inputs']:
                if old_number['company_contact_id'] == new_number['id']:
                    found = True
                    break
            if not found and old_number['contact_type'] == 'phone_number':
                data = {"updated_by": request.session['username']}
                response = requests.delete("{}/company/{}/contact/{}".format(settings.ADMIN_WS_URL, provider_id, old_number['company_contact_id']), data=data, headers=headers)
                validate_api_call(response, [])
                create_audit(request, headers, None, "COMPANY_CONTACT",
                         "Deleted contact phone number '{}' under provider '{}'".format(
                             old_number['contact_info'], old_provider['company_name']), "DELETE", provider_id, None)

        # Add New Destinations
        for new_dest in new_provider['destination_location']:
            found = False
            for old_dest in old_provider['company_destinations']:
                if int(new_dest) == old_dest['destination']['destination_id']:
                    found = True
                    break
            if not found:

                data = {'destination_id': int(new_dest)}
                data['created_by'] = request.session['username']
                response = requests.post("{}/company/{}/company_destination".format(settings.ADMIN_WS_URL, provider_id), data=data,
                                        headers=headers)

                validate_api_call(response, [409])
                # If there is a conflict, find the id of the conflicting resource and put it to be enabled
                if response.status_code == 409:
                    all_destinations = get_all_company_destinations(headers, provider_id)
                    for company_destination in all_destinations:
                        if company_destination['destination']['destination_id'] == int(new_dest):
                            updated_destination = {'enabled': True}
                            updated_destination['deleted'] = False
                            updated_destination['destination_id'] = int(new_dest)
                            updated_destination['updated_by'] = request.session['username']
                            response = requests.put("{}/company/{}/company_destination/{}".format(settings.ADMIN_WS_URL, provider_id, company_destination['company_destination_id']), data=updated_destination, headers=headers)
                            validate_api_call(response, [])
                create_audit(request, headers, None, "COMPANY_DESTINATION",
                         "Added new destination under provider '{}'".format(old_provider['company_name']), "ADD", provider_id, None)

        # Delete Old Destinations
        for old_dest in old_provider['company_destinations']:
            found = False
            for new_dest in new_provider['destination_location']:
                if old_dest['destination']['destination_id'] == int(new_dest):
                    found = True
                    break
            if not found:
                data = {"updated_by": request.session['username']}
                response = requests.delete("{}/company/{}/company_destination/{}".format(settings.ADMIN_WS_URL, provider_id, old_dest['company_destination_id']), data=data, headers=headers)
                validate_api_call(response, [])
                create_audit(request, headers, None, "COMPANY_DESTINATION",
                         "Deleted destination under provider '{}'".format(
                             old_provider['company_name']), "DELETE", provider_id, None)

        # Add New Curbsides
        for new_curb in new_provider['curbside_terminals']:
            found = False
            for old_curb in old_provider['curbside_check_ins']:
                if new_curb == old_curb['terminal']:
                    found = True
                    break
            if not found:
                data = {'terminal': new_curb}
                data['enabled'] = False
                data['created_by'] = request.session['username']
                response = requests.post("{}/company/{}/curbside".format(settings.ADMIN_WS_URL, provider_id), data=data,
                                        headers=headers)
                validate_api_call(response, [])
                create_audit(request, headers, None, "CURBSIDE_CHECKIN",
                         "Added curbside checkin '{}' under provider '{}'".format(
                             new_curb, old_provider['company_name']), "ADD", provider_id, None)

        # Delete Old Curbsides #
        for old_curb in old_provider['curbside_check_ins']:
            found = False
            for new_curb in new_provider['curbside_terminals']:
                if old_curb['terminal'] == new_curb:
                    found = True
                    break
            if not found:
                data = {"updated_by": request.session['username'] }
                response = requests.delete("{}/company/{}/curbside/{}".format(settings.ADMIN_WS_URL, provider_id, old_curb['curbside_check_in_id']), data=data, headers=headers)
                validate_api_call(response, [])
                create_audit(request, headers, None, "CURBSIDE_CHECKIN",
                         "Deleted curbside checkin under provider '{}'".format(
                             old_provider['company_name']), "DELETE", provider_id, None)

        # Let the display know we did an edit
        params = {"company_id": provider_id}
        display_response = requests.get("{}/display/company_contacts".format(settings.COORDINATOR_WS_URL),
                                        params=params)
        validate_api_call(display_response, [400, 404, 500, 403, 409])

        messages.success(request, "Saved")
        return redirect('edit_provider', provider_id)

    else:
        return redirect(reverse('admin_login'))

# POST: Locks a provider for a given reason or unlocks provider (specified by query param 'type')
@login_required
def lock_provider(request, provider_id, headers):

    if request.method == 'POST':
        reason = request.POST.get("reason")
        lock_type = request.POST.get("type")

        # Get the original provider
        response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), headers=headers)
        validate_api_call(response, [])
        provider_response = json.loads(response.text)['companies'][0]

        data = {'company_id': provider_id }
        data['company_name'] = provider_response['company_name']
        data['wheelchair'] = provider_response['wheelchair']
        data['display_name'] = provider_response['display_name']


        # Lock or Unlock the provider depending on the lock type
        if lock_type == 'lock':
            data['enabled'] = False
            data['audit_action_reason'] = reason
        else:
            data['enabled'] = True

        data['deleted'] = False
        data['updated_by'] = request.session['username']

        response = requests.put("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), data=data, headers=headers)
        validate_api_call(response, [])

        # Make the audit call after the lock/unlock call succeeds
        if lock_type == "lock":
            create_audit(request, headers, reason, "COMPANY",
                     "Locked provider '{}'".format(
                         data['company_name']), "UPDATE", provider_id, None)
        else:
            create_audit(request, headers, None, "COMPANY",
                         "Unlocked provider '{}'".format(data['company_name']), "UPDATE", provider_id, None)

        # Let the display know we locked/unlocked the account
        display_response = requests.get("{}/display/company/{}".format(settings.COORDINATOR_WS_URL, provider_id))

        # Validate the call but don't stop execution if it fails
        validate_api_call(display_response, [400, 404, 500, 403, 409])

        messages.success(request, "Successfully locked account.")
        return redirect('edit_provider', provider_id)

    else:
        return redirect('edit_provider', provider_id)

# POST: Deletes a provider for a given reason
@login_required
def delete_provider(request, provider_id, headers):

    if request.method == 'POST':

        reason = request.POST.get("reason")

        # Get the original provider
        response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), headers=headers)
        validate_api_call(response, [])
        provider_response = json.loads(response.text)['companies'][0]

        data = {'company_id': provider_id}
        data['company_name'] = provider_response['company_name']
        data['display_name'] = provider_response['display_name']
        data['wheelchair'] = provider_response['wheelchair']
        data['enabled'] = True
        data['deleted'] = True
        data['audit_action_reason'] = reason
        data['updated_by'] = request.session['username']

        response = requests.put("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), data=data, headers=headers)
        validate_api_call(response, [])
        create_audit(request, headers, reason, "COMPANY",
                     "Deleted provider '{}'".format(
                         data['company_name']), "DELETE", provider_id, None)

        # Let the display know we deleted a company
        display_response = requests.get("{}/display/company/{}".format(settings.COORDINATOR_WS_URL, provider_id))

        # Validate the call but don't stop execution if it fails
        validate_api_call(display_response, [400, 404, 500, 403, 409])

        messages.success(request, "Successfully deleted account.")
        return redirect('view_provider', provider_id)

    else:
        return redirect('edit_provider', provider_id)


# POST: Restores (undeletes) a provider
@login_required
def restore_provider(request, provider_id, headers):

    if request.method == "POST":

        # Ensure there are less than the MAX_COMPANIES_ALLOWED
        response = requests.get("{}/company".format(settings.ADMIN_WS_URL), headers=headers)
        validate_api_call(response, [])
        all_companies = json.loads(response.text)['companies']
        if len(all_companies) < MAX_COMPANIES_ALLOWED:

            # Get all the delete provider information
            response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), headers=headers)
            validate_api_call(response, [])
            deleted_provider = json.loads(response.text)['companies'][0]

            data = {'company_name': deleted_provider['company_name']}
            data['enabled'] = deleted_provider['enabled']
            data['deleted'] = False
            data['updated_by'] = request.session['username']
            data['display_name'] = deleted_provider['display_name']
            data['wheelchair'] = deleted_provider['wheelchair']

            response = requests.put("{}/company/{}".format(settings.ADMIN_WS_URL, provider_id), data=data,
                                    headers=headers)
            validate_api_call(response, [])
            create_audit(request, headers, None, "COMPANY",
                         "Restored provider '{}'".format(data['company_name']), "UPDATE", provider_id, None)

            # Let the display know we restored a company
            display_response = requests.get("{}/display/company/{}".format(settings.COORDINATOR_WS_URL, provider_id))

            # Validate the call but don't stop execution if it fails
            validate_api_call(display_response, [400, 404, 500, 403, 409])

            return redirect('view_provider', provider_id)

    else:
        return redirect('edit_provider', provider_id)

# GET: Returns a list of all providers in the shared ride system (when query param type = all, also return deleted)
@login_required
def get_all_providers(request, headers):
    if request.method == "GET":

        # Get All Provider Information
        parameters={"company_contact_info": "true"}

        if request.GET.get("type") == "all":
            parameters['include_deleted'] = "true"

        response = requests.get("{}/company".format(settings.ADMIN_WS_URL), params=parameters, headers=headers)
        validate_api_call(response, [])

        data = json.loads(response.text)

        return JsonResponse(data, safe=False)

    return HttpResponseNotAllowed(['GET'])

