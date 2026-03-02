from django.shortcuts import render
from .models import song

# Create your views here.
def index(request):
    songs = song.objects.all().order_by("id")
    selected_song = None
    selected_song_id = request.GET.get("song")

    if selected_song_id:
        try:
            selected_song = songs.filter(id=int(selected_song_id)).first()
        except (TypeError, ValueError):
            selected_song = None

    if selected_song is None:
        selected_song = songs.first()

    context = {
        "songs": songs,
        "selected_song": selected_song,
    }
    return render(request, "app/index.html", context)
