from django.db import models

# Create your models here.
class song(models.Model):
    title = models.TextField()
    artist = models.TextField()
    image = models.ImageField()
    audio_file = models.FileField()
    audio_link = models.CharField(max_length=20,blank=True,null=True)
    lyrics = models.TextField(blank=True,null=True)
    duration = models.CharField(max_length=20)
    paginate_by = 2

    def __str__(self):
        return self.title
