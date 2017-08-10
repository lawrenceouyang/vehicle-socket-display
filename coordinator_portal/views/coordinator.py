from django.http import Http404, JsonResponse, HttpResponse, HttpResponseNotAllowed
import requests
import json
import logging
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from coordinator_portal.views.app import login_required, admin_login_required, validate_api_call

logger = logging.getLogger(__name__)


@admin_login_required
def get_all_coordinators(request, headers):
    if request.method == 'GET':
        response = requests.get("{}/reference/role".format(settings.ADMIN_WS_URL), headers=headers)
        validate_api_call(response, [])
        all_roles = json.loads(response.text)['roles']
        coordinator_admin_role = -1
        coordinator_user_role = -1
        for role in all_roles:
            if role['role_name'] == "coordinator_admin":
                coordinator_admin_role = role['role_id']
            elif role['role_name'] == "coordinator_user":
                coordinator_user_role = role['role_id']

        # Get Coordinator Admins
        parameters = {"role_id": coordinator_admin_role, "include_deleted": False}
        response = requests.get("{}/user".format(settings.ADMIN_WS_URL), params=parameters, headers=headers)
        validate_api_call(response, [])
        admin_coordinators = json.loads(response.text)['users']

        # Get Coordinator Users
        parameters = {"role_id": coordinator_user_role,
                      "include_deleted": False}  # Replace 0 with designated coordinator company role
        response = requests.get("{}/user".format(settings.ADMIN_WS_URL), params=parameters, headers=headers)
        validate_api_call(response, [])
        user_coordinators = json.loads(response.text)['users']

        all_coordinators = admin_coordinators + user_coordinators

        return JsonResponse(all_coordinators, safe=False)
    else:
        return HttpResponseNotAllowed(['GET'])


@admin_login_required
def get_coordinator(request, coordinator_id, headers):
    if request.method == "GET":
        response = requests.get("{}/user/{}".format(settings.ADMIN_WS_URL, coordinator_id), headers=headers)
        validate_api_call(response, [])
        data = json.loads(response.text)['users'][0]
        return JsonResponse(data, safe=False)
    else:
        return HttpResponseNotAllowed(['GET'])


# To Do this need to check if the request is post, if not it shall reject
@csrf_exempt
@admin_login_required
def create_coordinator(request, headers):
    create_user_data = json.loads(request.body)
    # Get the ID corresponding to 'coordinator_admin' or 'coordinator_user' depending on form
    response = requests.get("{}/reference/role".format(settings.ADMIN_WS_URL), headers=headers)
    validate_api_call(response, [])
    all_roles = json.loads(response.text)['roles']
    coordinator_role_id = -1
    coordinator_role_name = "coordinator_user"
    if create_user_data['admin'] is True:
        coordinator_role_name = "coordinator_admin"
    for role in all_roles:
        if role['role_name'] == coordinator_role_name:
            coordinator_role_id = role['role_id']
            break


    # Attempt to create the user
    data = {'first_name': create_user_data['first_name']}
    data['last_name'] = create_user_data['last_name']
    data['email'] = create_user_data['email'].lower()
    data['enabled'] = True
    data['deleted'] = False
    data['activated'] = False
    data['reset_password'] = False
    data['created_by'] = request.session['username']
    data['role_id'] = coordinator_role_id

    response_created = requests.post("{}/user".format(settings.ADMIN_WS_URL), data=data, headers=headers)
    validate_api_call(response_created, [409])

    # If the user already exists, then get the user id of the failed user and PUT the new data
    if response_created.status_code == 409:
        response = requests.get("{}/user".format(settings.ADMIN_WS_URL), params={"email": data['email'], "include_deleted": True}, headers=headers)
        validate_api_call(response, [])
        for response_coordinator_data in json.loads(response.text)['users']:
            if response_coordinator_data['role']['role_name'] == "coordinator_admin" or response_coordinator_data['role']['role_name'] == "coordinator_user":
                if response_coordinator_data['deleted']:
                    new_user_id = response_coordinator_data['user_id']
                    updated_data = data
                    updated_data['updated_by'] = request.session['username']
                    updated_data['role_id'] = coordinator_role_id
                    response = requests.put("{}/user/{}".format(settings.ADMIN_WS_URL, new_user_id), data=updated_data, headers=headers)
                    validate_api_call(response, [])
                    return HttpResponse(status=response.status_code)
                else:
                    return HttpResponse(status=409)

    return HttpResponse(status=response_created.status_code)


@csrf_exempt
@admin_login_required
def edit_coordinator(request, coordinator_id, headers):
    if coordinator_id == request.session['user_id']:
        return HttpResponse(status=403)
    edit_user_data = json.loads(request.body)
    # Get the ID corresponding to 'coordinator_admin' or 'coordinator_user' depending on form
    response = requests.get("{}/reference/role".format(settings.ADMIN_WS_URL), headers=headers)
    validate_api_call(response, [])
    all_roles = json.loads(response.text)['roles']
    coordinator_role_id = -1
    coordinator_role_name = "coordinator_user"
    if edit_user_data['admin'] is True:
        coordinator_role_name = "coordinator_admin"
    for role in all_roles:
        if role['role_name'] == coordinator_role_name:
            coordinator_role_id = role['role_id']
            break

    data = {'first_name': edit_user_data['first_name']}
    data['last_name'] = edit_user_data['last_name']
    data['email'] = edit_user_data['email'].lower()
    data['enabled'] = True
    data['deleted'] = False
    data['activated'] = False
    data['reset_password'] = False
    data['created_by'] = request.session['username']
    data['role_id'] = coordinator_role_id
    data['updated_by'] = request.session['username']
    response_updated = requests.put("{}/user/{}".format(settings.ADMIN_WS_URL, coordinator_id), data=data, headers=headers)
    validate_api_call(response_updated, [409])

    # If the user already exists, then get the user id of the failed user and PUT the new data (Deprecated)
    # if response_updated.status_code == 409:
    #     response = requests.get("{}/user".format(settings.ADMIN_WS_URL),
    #                             params={"email": data['email'], "include_deleted": True}, headers=headers)
    #     validate_api_call(response, [])
    #     for response_coordinator_data in json.loads(response.text)['users']:
    #         if response_coordinator_data['role']['role_name'] == "coordinator_admin" or response_coordinator_data['role']['role_name'] == "coordinator_user":
    #             if response_coordinator_data['deleted']:
    #                 updated_user_id = response_coordinator_data['user_id']
    #                 updated_data = data
    #                 response = requests.put("{}/user/{}".format(settings.ADMIN_WS_URL, updated_user_id), data=updated_data,
    #                                         headers=headers)
    #                 validate_api_call(response, [])
    #                 return HttpResponse(status=response.status_code)
    #             else:
    #                 return HttpResponse(status=409)

    return HttpResponse(status=response_updated.status_code)



@csrf_exempt
@admin_login_required
def delete_coordinator(request, coordinator_id, headers):
    if coordinator_id == request.session['user_id']:
        return HttpResponse(status=403)
    data = {"updated_by": request.session['username']}
    response = requests.delete("{}/user/{}".format(settings.ADMIN_WS_URL, coordinator_id), data=data, headers=headers)
    validate_api_call(response, [])

    data = {"status_code": response.status_code}
    json_data = json.dumps(data)
    return HttpResponse(status=response.status_code)
