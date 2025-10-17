import os
import uuid
import qrcode
import json
import base64
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET", "change-me")

# Simple in-memory storage for demo
creations_db = {}

ALLOWED_IMAGE = {'.png', '.jpg', '.jpeg', '.gif', '.webp'}
ALLOWED_AUDIO = {'.mp3', '.ogg', '.wav', '.m4a'}

def allowed(filename, allowed_set):
    return os.path.splitext(filename)[1].lower() in allowed_set

def create_qr_code_data(url):
    """Create QR code as base64 data URL"""
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    import io
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_data = buffer.getvalue()
    img_base64 = base64.b64encode(img_data).decode()
    
    return f"data:image/png;base64,{img_base64}"

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
        
        # Convert images to base64 for storage
        saved_images = []
        for f in files:
            if f and allowed(f.filename, ALLOWED_IMAGE):
                # Convert to base64
                img_data = f.read()
                img_base64 = base64.b64encode(img_data).decode()
                saved_images.append(f"data:image/jpeg;base64,{img_base64}")

        final_song = None
        # Handle uploaded song
        if uploaded_song and uploaded_song.filename != '':
            if allowed(uploaded_song.filename, ALLOWED_AUDIO):
                song_data = uploaded_song.read()
                song_base64 = base64.b64encode(song_data).decode()
                final_song = f"data:audio/mpeg;base64,{song_base64}"

        # Generate QR code
        view_url = request.url_root.rstrip('/') + url_for('view_slideshow', uid=uid)
        qr_data = create_qr_code_data(view_url)

        # Save to in-memory database
        creation = {
            "id": uid,
            "url": view_url,
            "qr": qr_data,
            "thumb": saved_images[0] if saved_images else '',
            "theme": theme,
            "song": final_song or '',
            "date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "images": saved_images
        }
        creations_db[uid] = creation

        return render_template("result.html", creation=creation)

    # GET: show upload form
    return render_template("upload.html", builtins=[])

@app.route('/view/<uid>')
def view_slideshow(uid):
    # Find the creation
    item = creations_db.get(uid)
    if not item:
        return render_template("view.html", error="Slideshow not found."), 404
    
    return render_template("view.html", creation=item)

@app.route('/creations')
def show_creations():
    # Convert dict to list for template
    creations_list = list(creations_db.values())
    return render_template("creations.html", creations=creations_list)

@app.route('/delete/<uid>', methods=['POST'])
def delete_creation(uid):
    if uid in creations_db:
        del creations_db[uid]
        flash("Deleted creation.", "success")
    else:
        flash("Item not found.", "danger")
    return redirect(url_for('show_creations'))

# For local development
if __name__ == "__main__":
    app.run(debug=True)
