from django.http import Http404, JsonResponse
import requests
import json
import logging
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from coordinator_portal.views.error import validate_api_call
from coordinator_portal.views.app import login_required, admin_login_required

logger = logging.getLogger(__name__)


@login_required
def get_company(request, company_id, headers):
    parameters = {"company_contact_info": "true", "curbside_check_in_info": "true", "company_destination_info": "true"}
    response = requests.get("{}/company/{}".format(settings.ADMIN_WS_URL, company_id), params=parameters,
                            headers=headers)
    validate_api_call(response, [])

    data = json.loads(response.text)['companies'][0]
    return JsonResponse(data, safe=False)

@login_required
def get_all_companies(request, headers):
    response = requests.get("{}/company".format(settings.ADMIN_WS_URL), headers=headers)
    validate_api_call(response, [])
    data = json.loads(response.text)
    return JsonResponse(data, safe=False)

@login_required
def get_vehicle(request, company_id, vehicle_id, headers):
    response = requests.get("{}/gtms/vehicle/{}/".format(settings.ADMIN_WS_URL, vehicle_id), headers=headers)
    validate_api_call(response, [])
    data = json.loads(response.text)
    return JsonResponse(data, safe=False)

@login_required
def get_all_company_vehicles(request, company_id, headers):
    response = requests.get("{}/gtms/company/{}/vehicle".format(settings.ADMIN_WS_URL, company_id), headers=headers)
    validate_api_call(response, [])
    data = json.loads(response.text)
    return JsonResponse(data, safe=False)

@login_required
def get_company_destinations(request, company_id, headers):
    response = requests.get("{}/company/{}/company_destination".format(settings.ADMIN_WS_URL, company_id), headers=headers)
    validate_api_call(response, [])
    data = json.loads(response.text)
    return JsonResponse(data, safe=False)

@login_required
def get_all_checkins(request, headers):
    response = requests.get("{}/company/checkedin_vehicles".format(settings.COORDINATOR_WS_URL),
                            headers=headers)
    validate_api_call(response, [404])

    if response.status_code == 204 or response.status_code == 404:
        data = {"data" : []}
    else:
        data = json.loads(response.text)

    return JsonResponse(data, safe=False)

@login_required
def get_checkin_detail(request, company_id, vehicle_number, headers):
    params = {"vehicle_number": vehicle_number}
    response = requests.get("{}/company/{}/vehicle_destinations".format(settings.COORDINATOR_WS_URL, company_id),
                            params=params, headers=headers)
    validate_api_call(response, [])

    data = json.loads(response.text)
    return JsonResponse(data, safe=False)


@csrf_exempt
@login_required
def create_checkin(request, company_id, headers):

    if request.method == "POST":
        check_in_data = json.loads(request.body)

        check_in_data_send = [("vehicle_number", check_in_data['vehicle_number']), ("checkin_by", request.session['username'])]
        for destination in check_in_data['destination_list']:
            check_in_data_send.append(("destination_ids", destination['destination']['destination_id']))

        response = requests.post("{}/company/{}/checkedin_destinations".format(settings.COORDINATOR_WS_URL, company_id),
                                data=check_in_data_send)
        validate_api_call(response, [])

        data = {"status_code": response.status_code}

        # Let the display know we did a checkin
        params = {"company_id": company_id}
        display_response = requests.get("{}/display/company_destinations".format(settings.COORDINATOR_WS_URL),
                                        params=params)
        validate_api_call(display_response, [])

        json_data = json.dumps(data)
        return JsonResponse(json_data, safe=False)

    else:
        return Http404


@csrf_exempt
@login_required
def edit_checkin(request, company_id, headers):

    if request.method == "POST":
        form_data = json.loads(request.body)
        edit_data = [("vehicle_number", form_data['vehicle_number']), ("edit_by", request.session['username'])]
        for destination in form_data['destination_list']:
            edit_data.append(("destination_ids", destination['destination_id']))

        response = requests.put("{}/company/{}/checkedin_destinations".format(settings.COORDINATOR_WS_URL, company_id),
                                data=edit_data)
        validate_api_call(response, [])

        data = {"status_code": response.status_code}

        # Let the display know we did an edit
        params = {"company_id": company_id}
        display_response = requests.get("{}/display/company_destinations".format(settings.COORDINATOR_WS_URL),
                                        params=params)
        validate_api_call(display_response, [])

        json_data = json.dumps(data)
        return JsonResponse(json_data, safe=False)

    else:
        return Http404

@csrf_exempt
@login_required
def delete_checkin(request, company_id, headers):

    if request.method == "POST":
        form_data = json.loads(request.body)
        delete_data = {"vehicle_number": form_data['vehicle_number']}
        delete_data['checkout_by'] = request.session['username']

        response = requests.delete("{}/company/{}/checkedin_destinations".format(settings.COORDINATOR_WS_URL, company_id),
                                data=delete_data)
        validate_api_call(response, [])

        data = {"status_code": response.status_code}

        # Let the display know we did a delete
        params = {"company_id": company_id}
        display_response = requests.get("{}/display/company_destinations".format(settings.COORDINATOR_WS_URL),
                                        params=params)
        validate_api_call(display_response, [])

        json_data = json.dumps(data)
        return JsonResponse(json_data, safe=False)

    else:
        return Http404

@csrf_exempt
@login_required
def create_checkout(request, company_id, headers):

    if request.method == "POST":
        check_out_data = json.loads(request.body)

        check_out_data_send = [("vehicle_number", check_out_data['vehicle_number']), ("checkout_by", request.session['username'])]
        for destination in check_out_data['destination_list']:
            check_out_data_send.append(("destination_ids", destination['destination_id']))

        # Check out the vehicle
        response = requests.put("{}/company/{}/checkedout_destinations".format(settings.COORDINATOR_WS_URL, company_id),
                                data=check_out_data_send)
        validate_api_call(response, [])

        data = {"status_code": response.status_code}

        # Let the display know we did a checkout
        params={"company_id": company_id }
        display_response = requests.get("{}/display/company_destinations".format(settings.COORDINATOR_WS_URL), params=params)
        validate_api_call(display_response, [])

        json_data = json.dumps(data)
        return JsonResponse(json_data, safe=False)

    else:
        return Http404





