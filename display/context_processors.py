from shared_ride_vans import display_settings


def version_number(request):
    return {'VERSION': display_settings.VERSION}


def environment(request):
    return {'ENV': display_settings.BUILD_ENV}

