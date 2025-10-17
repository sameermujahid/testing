import os
import uuid
import qrcode
import json
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, flash

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", "change-me")
BASE = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE, "static", "uploads")
SONGS_FOLDER = os.path.join(BASE, "static", "songs")
CREATIONS_FILE = os.path.join(BASE, "creations.json")

# ensure directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(SONGS_FOLDER, exist_ok=True)

# load creations metadata
if os.path.exists(CREATIONS_FILE):
    try:
        with open(CREATIONS_FILE, "r", encoding="utf-8") as f:
            creations = json.load(f)
    except Exception:
        creations = []
else:
    creations = []

def save_creations():
    with open(CREATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(creations, f, indent=2, ensure_ascii=False)

ALLOWED_IMAGE = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
ALLOWED_AUDIO = {'.mp3', '.ogg', '.wav', '.m4a'}

def allowed(filename, allowed_set):
    return os.path.splitext(filename)[1].lower() in allowed_set

@app.route('/')
def index():
    return redirect(url_for('upload_page'))

@app.route('/upload', methods=['GET', 'POST'])
def upload_page():
    if request.method == "POST":
        files = request.files.getlist('images')
        theme = request.form.get('theme', 'cinematic')
        built_song = request.form.get('song_select', '')
        uploaded_song = request.files.get('song_upload')

        if not files or all(f.filename == '' for f in files):
            flash("Please upload at least one image.", "danger")
            return redirect(request.url)

        uid = uuid.uuid4().hex
        folder = os.path.join(UPLOAD_FOLDER, uid)
        os.makedirs(folder, exist_ok=True)

        saved_images = []
        for f in files:
            if f and allowed(f.filename, ALLOWED_IMAGE):
                safe_name = f"{uuid.uuid4().hex}_{f.filename}"
                path = os.path.join(folder, safe_name)
                f.save(path)
                saved_images.append(f"/static/uploads/{uid}/{safe_name}")

        final_song = None
        # uploaded song
        if uploaded_song and uploaded_song.filename != '':
            if allowed(uploaded_song.filename, ALLOWED_AUDIO):
                sname = f"{uuid.uuid4().hex}_{uploaded_song.filename}"
                target = os.path.join(SONGS_FOLDER, sname)
                uploaded_song.save(target)
                final_song = f"/static/songs/{sname}"
            else:
                flash("Uploaded song file type not supported. Skipping uploaded song.", "warning")

        # built-in song selection
        if not final_song and built_song and built_song != '':
            # built_song expected as plain filename from SONGS_FOLDER (we pass exact filename)
            candidate = os.path.join(SONGS_FOLDER, os.path.basename(built_song))
            if os.path.exists(candidate):
                final_song = f"/static/songs/{os.path.basename(built_song)}"

        # generate qr and metadata
        view_url = request.url_root.rstrip('/') + url_for('view_slideshow', uid=uid)
        qr_path = os.path.join(folder, "qr.png")
        qrcode.make(view_url).save(qr_path)

        # save metadata to creations
        creation = {
            "id": uid,
            "url": view_url,
            "qr": f"/static/uploads/{uid}/qr.png",
            "thumb": saved_images[0] if saved_images else '',
            "theme": theme,
            "song": final_song or '',
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "images": saved_images
        }
        creations.insert(0, creation)  # latest first
        save_creations()

        return render_template("result.html", creation=creation)

    # GET: list built-in songs
    builtins = [f for f in os.listdir(SONGS_FOLDER) if os.path.splitext(f)[1].lower() in ALLOWED_AUDIO]
    return render_template("upload.html", builtins=builtins)

@app.route('/view/<uid>')
def view_slideshow(uid):
    # find the creation
    item = next((c for c in creations if c['id'] == uid), None)
    if not item:
        return render_template("view.html", error="Slideshow not found."), 404
    
    # Ensure images array exists
    if 'images' not in item or not item['images']:
        item['images'] = []
    
    return render_template("view.html", creation=item)

@app.route('/creations')
def show_creations():
    return render_template("creations.html", creations=creations)

@app.route('/delete/<uid>', methods=['POST'])
def delete_creation(uid):
    global creations
    item = next((c for c in creations if c['id'] == uid), None)
    if not item:
        flash("Item not found.", "danger")
        return redirect(url_for('show_creations'))
    # remove folder
    folder = os.path.join(UPLOAD_FOLDER, uid)
    try:
        if os.path.exists(folder):
            for f in os.listdir(folder):
                os.remove(os.path.join(folder, f))
            os.rmdir(folder)
    except Exception:
        pass
    creations = [c for c in creations if c['id'] != uid]
    save_creations()
    flash("Deleted creation.", "success")
    return redirect(url_for('show_creations'))


if __name__ == "__main__":
    app.run(debug=True)
