from shared_ride_vans import coordinator_settings


def version_number(request):
    return {'VERSION': coordinator_settings.VERSION}


def environment(request):
    return {'ENV': coordinator_settings.BUILD_ENV}
