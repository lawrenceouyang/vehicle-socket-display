from django.conf import settings


def version_number(request):
    return {'VERSION': settings.VERSION}


def environment(request):
    return {'ENV': settings.BUILD_ENV}
