import logging
from django.core.exceptions import PermissionDenied, SuspiciousOperation
from django.core.urlresolvers import reverse
from django.http import Http404, HttpResponseServerError
from django.shortcuts import redirect

logger = logging.getLogger(__name__)


def validate_api_call(response, exceptions):
    """ Validates that the API call response is successful response or within the exceptions list """
    if (response.status_code < 200 or response.status_code > 299) and response.status_code not in exceptions:
        logger.critical("status_code={} message=WS URI '{}' returned a status code '{}' which was not in the "
                        "exceptions list.".format(response.status_code, response.request.url, response.status_code))
        raise Exception("Shared Ride Van Webservice Status Code Error. Status Code {}".format(response.status_code))


def exception_catch(function):
    """ Function Decorator: Error exception for all views. Will log the traceback, user, page, and error, while raising
     the error to the view renderer"""
    def wrapper(request, *args, **kw):
        try:
            return function(request, *args, **kw)
        except Http404:
            logger.exception("status_code={} message=Internal Django Error. Page '{}' raised a page not found."
                             .format(404, request.path))
            raise Http404

        except PermissionDenied:
            logger.exception("status_code={} message=Internal Django Error. Page '{}' raised a permission denied"
                             .format(403, request.path))
            raise PermissionDenied

        except SuspiciousOperation:
            logger.exception("status_code={} message=Internal Django Error. Page '{}' raised a bad request"
                             .format(400, request.path))
            raise SuspiciousOperation

        except Exception as e:
            logger.exception("status_code={} message=Internal Django Error. Page '{}' raised the error: '{}'."
                             .format(500, request.path, e))
            raise Exception
    return wrapper


def ajax_catch(function):
    """ Function Decorator: Error exception for ajax calls. Will log the traceback, user, page, and error. The call will
     then return a 500 """
    def wrapper(request, *args, **kw):
        try:
            return function(request, *args, **kw)
        except Exception as e:
            logger.exception("status_code={} message=Internal Django Error. Ajax URL '{}' raised the error: '{}'."
                             .format(500, request.path, e))
            raise Exception
    return wrapper