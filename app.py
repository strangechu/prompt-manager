import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from models import db, Prompt

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///prompts.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024 # 16MB max upload

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/prompts', methods=['GET'])
def get_prompts():
    search_query = request.args.get('q', '')
    if search_query:
        prompts = Prompt.query.filter(
            (Prompt.name.contains(search_query)) | 
            (Prompt.content.contains(search_query))
        ).all()
    else:
        prompts = Prompt.query.all()
    return jsonify([p.to_dict() for p in prompts])

@app.route('/api/prompts', methods=['POST'])
def create_prompt():
    data = request.form
    image = request.files.get('image')
    
    image_filename = None
    if image:
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        image_filename = filename

    new_prompt = Prompt(
        name=data['name'],
        type=data['type'],
        content=data['content'],
        image_filename=image_filename
    )
    db.session.add(new_prompt)
    db.session.commit()
    return jsonify(new_prompt.to_dict()), 201

@app.route('/api/prompts/<int:id>', methods=['PUT'])
def update_prompt(id):
    prompt = Prompt.query.get_or_404(id)
    data = request.form
    image = request.files.get('image')

    prompt.name = data.get('name', prompt.name)
    prompt.type = data.get('type', prompt.type)
    prompt.content = data.get('content', prompt.content)

    if image:
        # Delete old image if exists? Optional.
        filename = secure_filename(image.filename)
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        prompt.image_filename = filename

    db.session.commit()
    return jsonify(prompt.to_dict())

@app.route('/api/prompts/<int:id>', methods=['DELETE'])
def delete_prompt(id):
    prompt = Prompt.query.get_or_404(id)
    db.session.delete(prompt)
    db.session.commit()
    return '', 204

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
    app.run(debug=True)
