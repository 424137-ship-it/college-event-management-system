from rest_framework import permissions

class IsAdminUserRole(permissions.BasePermission):
    """
    Allows access only to Admin users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser))

class IsOrganizerUserRole(permissions.BasePermission):
    """
    Allows access to approved Organizers and Admins.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return True
        if request.user.role == 'ORGANIZER':
            return getattr(request.user, 'is_approved', True)
        return False

class IsStudentUserRole(permissions.BasePermission):
    """
    Allows access to Students (and higher roles).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to allow owners or admins to edit/delete.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return True
        user_field = getattr(obj, 'user', None) or getattr(obj, 'organizer', None)
        return user_field == request.user
