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
APP_NAME = os.environ.get('APP_NAME', 'ADMIN')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = '#REDACTED'

# SECURITY WARNING: don't run with debug turned on in production!

DEBUG = True
ALLOWED_HOSTS = ['*']

SESSION_COOKIE_NAME = '{}-srv-admin'.format(BUILD_ENV.lower())

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'admin_portal.apps.AdminPortalConfig'
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
                'admin_portal.context_processors.version_number',
                'admin_portal.context_processors.environment'
            ],
        },
    },
]

WSGI_APPLICATION = 'shared_ride_vans.wsgi.application'

# Database

# On servers, move sqlite to different directory to avoid clearing session on redeployment
SQLITE_DIR = BASE_DIR + "/../../SharedRideAdminAppSQLite/"

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
        'admin_portal': {
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
    AD_WS_URL = '#REDACTED#'
    ADMIN_WS_URL = '#REDACTED#'
    EMAIL_WS_URL = '#REDACTED#'
    COORDINATOR_WS_URL = '#REDACTED#'
    DISPLAY_WS_URL = '#REDACTED#'
    COMPANY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
elif BUILD_ENV == "DEV":
    AD_WS_URL = '#REDACTED#'
    ADMIN_WS_URL = '#REDACTED#'
    EMAIL_WS_URL = '#REDACTED#'
    COORDINATOR_WS_URL = '#REDACTED#'
    DISPLAY_WS_URL = '#REDACTED#'
    COMPANY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
elif BUILD_ENV == "QA":
    AD_WS_URL = '#REDACTED#'
    ADMIN_WS_URL = '#REDACTED#'
    EMAIL_WS_URL = '#REDACTED#'
    COORDINATOR_WS_URL = '#REDACTED#'
    DISPLAY_WS_URL = '#REDACTED#'
    COMPANY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
    DEBUG = False
elif BUILD_ENV == "STG":
    AD_WS_URL = '#REDACTED#'
    ADMIN_WS_URL = '#REDACTED#'
    EMAIL_WS_URL = '#REDACTED#'
    COORDINATOR_WS_URL = '#REDACTED#'
    DISPLAY_WS_URL = '#REDACTED#'
    COMPANY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
    DEBUG = False
elif BUILD_ENV == "PROD":
    AD_WS_URL = '#REDACTED#'
    ADMIN_WS_URL = '#REDACTED#'
    EMAIL_WS_URL = '#REDACTED#'
    COORDINATOR_WS_URL = '#REDACTED#'
    DISPLAY_WS_URL = '#REDACTED#'
    COMPANY_WS_URL = '#REDACTED#'
    SOCKET_URL = '#REDACTED#'
    DEBUG = False

if BUILD_ENV != "LOCAL" and BUILD_ENV != "DEV":
    SESSION_EXPIRE_AT_BROWSER_CLOSE = True
    SESSION_SAVE_EVERY_REQUEST = True
    SESSION_COOKIE_AGE = 30 * 60

if BUILD_ENV != "LOCAL":
    LOGGING["handlers"]["default"]["class"] = 'logging.FileHandler'
    LOGGING["handlers"]["default"]["filename"] = '/sfo/webapplications/djangoApps/SharedRideAdminApp/logs/srv_django.log/'

TOKEN_EXPIRE_TIME_HOURS = 12

SERVICE_AUTH_HEADER = {"authorization": '#REDACTED'}

# Allowed Hosts
if BUILD_ENV == "DEV":
    ALLOWED_HOSTS = ['#REDACTED#']
elif BUILD_ENV == "qa-company":
    ALLOWED_HOSTS = ['#REDACTED#']
elif BUILD_ENV == "stg-company":
    ALLOWED_HOSTS = ['#REDACTED#']
elif BUILD_ENV == "prd-company":
    ALLOWED_HOSTS = ['#REDACTED#']