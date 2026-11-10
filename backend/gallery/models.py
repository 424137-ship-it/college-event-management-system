from django.db import models

class GalleryAlbum(models.Model):
    event = models.ForeignKey('events.Event', on_delete=models.SET_NULL, null=True, blank=True, related_name='albums')
    club = models.ForeignKey('clubs.Club', on_delete=models.SET_NULL, null=True, blank=True, related_name='albums')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class GalleryImage(models.Model):
    album = models.ForeignKey(GalleryAlbum, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='gallery/', blank=True, null=True)
    image_url = models.URLField(blank=True)
    caption = models.CharField(max_length=255, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"Image in {self.album.title}: {self.caption or self.id}"
