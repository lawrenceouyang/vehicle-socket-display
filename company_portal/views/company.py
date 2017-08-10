from django.http import Http404, JsonResponse
import requests
import json
import logging
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from company_portal.views.error import validate_api_call
from company_portal.views.account import login_required, unlock_required, unlock_company_required

logger = logging.getLogger(__name__)


def parse_status(status):
    if status:
        return "enabled"
    else:
        return "disabled"


def get_action_id(headers, action_name):
    response = requests.get("{}/user/audit/actions".format(settings.COMPANY_WS_URL), headers=headers)
    action_list = json.loads(response.text)['actions']
    for action in action_list:
        if action['action_name'] == action:
            return action['action_id']


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


@login_required
@unlock_required
@unlock_company_required
def get_company_info(request, headers):

    response = requests.get("{}/company/{}".format(settings.COMPANY_WS_URL, request.session['company_id']),
                            headers=headers)
    validate_api_call(response, [])

    data = json.loads(response.text)
    return JsonResponse(data, safe=False)


@login_required
@unlock_required
@unlock_company_required
def get_company_available_destinations(request, headers):

    response = requests.get("{}/company/{}/trip-destination".format(settings.COMPANY_WS_URL, request.session['company_id']),
                            headers=headers)
    validate_api_call(response, [])

    data = json.loads(response.text)
    return JsonResponse(data, safe=False)


@login_required
@unlock_required
@unlock_company_required
def get_company_curbside_checkins(request, headers):

    response = requests.get("{}/company/{}/curbside-checkin".format(settings.COMPANY_WS_URL, request.session['company_id']),
                            headers=headers)
    validate_api_call(response, [])

    data = json.loads(response.text)
    return JsonResponse(data, safe=False)


@login_required
@unlock_required
@unlock_company_required
def get_company_contact_info(request, headers):

    response = requests.get("{}/company/{}/company-contact".format(settings.COMPANY_WS_URL, request.session['company_id']),
                            headers=headers)
    validate_api_call(response, [])

    data = json.loads(response.text)
    return JsonResponse(data, safe=False)


@login_required
@unlock_required
@unlock_company_required
def get_all_company_editable_info(request, headers):

    response = requests.get("{}/company/{}/curbside-checkin".format(settings.COMPANY_WS_URL, request.session['company_id']),
                            headers=headers)
    validate_api_call(response, [])

    editable_info = {"curbside_checkin": json.loads(response.text)['curbside_checkin']}

    response = requests.get("{}/company/{}/company-contact".format(settings.COMPANY_WS_URL, request.session['company_id']),
                            headers=headers)
    validate_api_call(response, [])

    editable_info['company_contact'] = json.loads(response.text)['company_contact']

    return JsonResponse(editable_info, safe=False)

@csrf_exempt
@login_required
@unlock_required
@unlock_company_required
def edit_contact_info(request, headers):

    information_data = json.loads(request.body)['information_data']

    # First iterate through curbside_checkins
    for curbside in information_data['curbside_checkin']:
        response = requests.put("{}/company/{}/curbside-checkin/{}".format(
            settings.COMPANY_WS_URL, request.session['company_id'], curbside['curbside_checkin_id']),
            params={"enabled": curbside['enabled']}, headers=headers)
        validate_api_call(response, [])

        create_audit(request, headers, None, "CURBSIDE_CHECKIN", "Set curbside checkin option '{}' to '{}'".format(
            curbside['terminal'], parse_status(curbside['enabled'])), "UPDATE", request.session['company_id'], None)


    # Next iterate through company_contacts
    for contact in information_data['company_contact']:
        response = requests.put("{}/company/{}/company-contact/{}".format(
            settings.COMPANY_WS_URL, request.session['company_id'], contact['company_contact_id']),
            params={"enabled": contact['enabled']}, headers=headers)
        validate_api_call(response, [])

        create_audit(request, headers, None, "COMPANY_CONTACT", "Set contact information '{}' to '{}'".format(
            contact['contact_info'], parse_status(contact['enabled'])), "UPDATE", request.session['company_id'], None)


    # Finally, let the display know we've made changes to a company's contact info or curbside checkins
    params = {"company_id": request.session['company_id']}
    display_response = requests.get("{}/display/company_contacts".format(settings.COORDINATOR_WS_URL), params=params)
    validate_api_call(display_response, [])

    # Return a 200 to the front-end
    data = {"status_code": 200}
    return JsonResponse(data, safe=False)


