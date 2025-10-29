from rest_framework import permissions

class IsFirebaseAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        claims = request.user or {}
        return claims.get('admin', False)
