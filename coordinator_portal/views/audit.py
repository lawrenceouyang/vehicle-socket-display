from django.http import JsonResponse
import json
import requests
from django.conf import settings
from coordinator_portal.views.error import validate_api_call


def get_action_id(headers, action_name):
    response = requests.get("{}/reference/action".format(settings.ADMIN_WS_URL), headers=headers)
    validate_api_call(response, [])
    for action in json.loads(response.text)['actions']:
        if action['action_name'] == action_name:
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
