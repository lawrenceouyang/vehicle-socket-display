"""
Django settings for shared_ride_vans project.

Generated by 'django-admin startproject' using Django 1.10.3.

For more information on this file, see
https://docs.djangoproject.com/en/1.10/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/1.10/ref/settings/
"""
import os

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Version
BUILD_ENV = os.environ.get('ENV', 'LOCAL')
BUILD_NUMBER = os.environ.get('BUILD_NUMBER', 0)  # Jenkins Build Number
RELEASE = '0'        # Each development milestone  QA/UAT
MINOR_VERSION = '0'  # +1 for every time we go public"
MAJOR_VERSION = '0'  # Significant change. Business Approval Required
VERSION = '{} {}.{}.{}.{}'.format(BUILD_ENV, MAJOR_VERSION, MINOR_VERSION, RELEASE, BUILD_NUMBER)

# APP NAME: Set APP_NAME to "ADMIN", "COMPANY", "COORDINATOR", "DISPLAY" to change the app to test on.
# Defaults to running all apps on the same port
APP_NAME = os.environ.get('APP_NAME', 'DISPLAY')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '#REDACTED#'

# SECURITY WARNING: don't run with debug turned on in production!

DEBUG = True
ALLOWED_HOSTS = ['*']

SESSION_COOKIE_NAME = '{}-srv-display'.format(BUILD_ENV.lower())

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'display.apps.DisplayConfig'
]

MIDDLEWARE_CLASSES = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'shared_ride_vans.urls'


TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'display.context_processors.version_number',
                'display.context_processors.environment'
            ],
        },
    },
]

WSGI_APPLICATION = 'shared_ride_vans.wsgi.application'


# Database

# On servers, move sqlite to different directory to avoid clearing session on redeployment
SQLITE_DIR = BASE_DIR + "/../../SharedRideDisplayAppSQLite/"

if BUILD_ENV == "LOCAL":
    SQLITE_DIR = BASE_DIR

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(SQLITE_DIR, 'db.sqlite3'),
    }
}

if BUILD_ENV == "LOCAL":
    DATABASES["default"]["NAME"] = os.path.join(BASE_DIR, 'db.sqlite3')

# Password validation
# https://docs.djangoproject.com/en/1.10/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/1.10/topics/i18n/

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'US/Pacific'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s %(funcName)s %(name)s %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'handlers': {
        'default': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
    },
    'loggers': {
        'django': {
            'handlers': ['default'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['default'],
            'level': 'INFO',
            'propagate': False,
        },
        'display': {
            'handlers': ['default'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.10/howto/static-files/
STATIC_URL = '/static/'

# WS URLs
if BUILD_ENV == "LOCAL":
    DISPLAY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
elif BUILD_ENV == "DEV":
    DISPLAY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
elif BUILD_ENV == "QA":
    DISPLAY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
    DEBUG = False
elif BUILD_ENV == "STG":
    DISPLAY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
    DEBUG = False
elif BUILD_ENV == "PROD":
    DISPLAY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
    DEBUG = False

if BUILD_ENV != "LOCAL":
    LOGGING["handlers"]["default"]["class"] = 'logging.FileHandler'
    LOGGING["handlers"]["default"]["filename"] = '#REDACTED#'

# Allowed Hosts
if BUILD_ENV == "DEV":
    ALLOWED_HOSTS = ['#REDACTED#']
elif BUILD_ENV == "QA":
    ALLOWED_HOSTS = ['#REDACTED#']
elif BUILD_ENV == "STG":
    ALLOWED_HOSTS = ['#REDACTED#']
elif BUILD_ENV == "PROD":
    ALLOWED_HOSTS = ['#REDACTED#']