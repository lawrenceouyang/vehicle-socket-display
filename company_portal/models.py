from __future__ import unicode_literals

from django.db import models


class Token_Entry(models.Model):

    class Meta:
        app_label = 'company_portal'

    tokens = models.Manager()

    uuid = models.UUIDField(primary_key=True, editable=False)
    email = models.EmailField(max_length=500, blank=False, null=False)
    company_id = models.CharField(max_length=500, default=-1, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_in_hours = models.PositiveIntegerField(default=12, blank=False, null=False)

    def __str__(self):
        return self.uuid

    def get_email(self):
        return self.email

    def get_company_id(self):
        return self.company_id

    def get_timestamp(self):
        return self.created_at

    def get_expiration_hours(self):
        return self.expires_in_hours
