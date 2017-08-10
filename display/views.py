from django.shortcuts import render
from django.conf import settings
from helpers import validate_api_call, exception_catch, ajax_catch
from django.http import JsonResponse
import requests
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


@exception_catch
def index(request, location):
    """ Main Display Page. Renders templates for display based on location. """
    if request.method == 'GET':
        location_list = [
            'international-g',
            'terminal-1',
            'terminal-2',
            'terminal-3'
        ]
        if location == 'public' or location == 'public/':
            return render(request, 'ajax-display.html')
        elif location in location_list:
            readable_location = {
                'international-g': 'International Terminal',
                'terminal-1': 'Terminal 1',
                'terminal-2': 'Terminal 2',
                'terminal-3': 'Terminal 3'
            }
            logger.info('Rendering display for location "{}".'.format(location))
            return render(request, 'socket-display.html', {'socket_url': settings.SOCKET_URL, 'location': location,
                                                           'readable_location': readable_location[location]})
        else:
            logger.warning('An attempt to access the display with no location was made.')
            return render(request, 'no_location.html')


@ajax_catch
def load_availability_data(request):
    """ Ajax call for getting the availability data using a rest call to the webservice. Returns a formatted JSON object
        that the display knows how to parse. """
    if request.method == 'GET':
        company_contact_response = requests.get("{}/company/contacts".format(settings.DISPLAY_WS_URL))
        validate_api_call(company_contact_response, [])

        company_availability_response = requests.get("{}/company/destinations".format(settings.DISPLAY_WS_URL))
        validate_api_call(company_availability_response, [])

        config_response = requests.get("{}/company/config".format(settings.DISPLAY_WS_URL))
        validate_api_call(config_response, [])

        company_contact_data = {
            'availability': []
        }
        company_availability_data = {}

        # If the company and contacts are not empty, rename the key 'data' to 'availability'
        if company_contact_response.status_code != 204:
            company_contact_data = company_contact_response.json()
            company_contact_data['availability'] = company_contact_data.pop('data', None)

        # If the location availability is not empty, load the data into a data object
        if company_availability_response.status_code != 204:
            company_availability_data = company_availability_response.json()

        # If the config is not empty, load the return object's config with the raw key value pairs
        if config_response.status_code != 204:
            config_response_data = config_response.json()
            company_contact_data['config'] = config_response_data['data']

        # If both the availability and contacts are not empty, load the corresponding availability with the
        # corresponding company
        if company_availability_response.status_code != 204 and company_contact_response.status_code != 204:
            for company_contact in company_contact_data['availability']:
                for company in company_availability_data['data']:
                    if company['company_id'] == company_contact['company_id']:
                        company_contact['destinations'] = company['destinations']
                        break
        return JsonResponse(company_contact_data)
    raise Exception


@ajax_catch
def server_time(request):
    """ Ajax call for getting the server time. Returns a formatted JSON object with the datetime. """
    if request.method == 'GET':
        return JsonResponse({'datetime': datetime.now().strftime('%m-%d-%Y %H:%M:%S.%f')})
    raise Exception


"""Error Pages will simply lead to the no location page for simplicity's sake. """
def shared_rides_not_found(request):
    return render(request, 'no_location.html')


def shared_rides_server_error(request):
    return render(request, 'no_location.html')


def shared_rides_permission_denied(request):
    return render(request, 'no_location.html')


def shared_rides_bad_request(request):
    return render(request, 'no_location.html')


