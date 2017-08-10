from django import forms
import json
import logging

logger = logging.getLogger(__name__)


# Helper Function
# Runs Django form validation and automatically logs all errors in a readable JSON format
def form_is_valid(form):
    if form.is_valid():
        return True
    else:
        error = []
        values = form.errors.values()
        for i, key in enumerate(form.errors.keys()):
            value = values[i]
            error.append({key: str(value[0])})
            logger.error("Validation Error: {} ".format(json.dumps(error, indent=3, sort_keys=True)))
        return False


class LoginForm(forms.Form):
    username = forms.CharField(max_length=100, required=True)
    password = forms.PasswordInput()



