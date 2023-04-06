from flask import Flask, render_template, request, redirect, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
db = SQLAlchemy(app)
migrate = Migrate(app, db)

class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    task_name = db.Column(db.String(200), nullable=False)

class WorkflowStep(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    likes = db.Column(db.Integer, default=0)
    category = db.Column(db.String(50), nullable=False)  # Add this line
    task_id = db.Column(db.Integer, db.ForeignKey('task.id'), nullable=False)
    task = db.relationship('Task', backref=db.backref('workflow_steps', lazy=True))
    tool_description = db.Column(db.String(1000),nullable=True)
    huggingface_url = db.Column(db.String(200),nullable=True)
    github_url = db.Column(db.String(200), nullable=True) # Add this line
    chatgpt_prompt = db.Column(db.String(1000),nullable=True)
    research_description = db.Column(db.String(1000),nullable = True)
    research_url = db.Column(db.String(200),nullable=True)    

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        data = request.get_json()
        print(f'data in index: {data}')
        task_name = data['task']
        new_task = Task(task_name=task_name)

        try:
            db.session.add(new_task)
            db.session.commit()
            return jsonify({'task_id': new_task.id})  # Return JSON response
        except Exception as e:
            print(e)
            return 'There was an issue adding your task'

    tasks = Task.query.order_by(Task.id).all()

    # Fetch workflow steps for each task and create a list of dictionaries
    tasks_data = []
    for task in tasks:
        workflow_steps = {
            category: WorkflowStep.query.filter_by(task_id=task.id, category=category).order_by(WorkflowStep.likes.desc()).all()
            for category in ('workflow_step', 'tools', 'chatgpt_prompts', 'influential_research')
        }
        tasks_data.append({'task': task, 'workflow_steps': workflow_steps})

    return render_template('index.html', tasks_data=tasks_data)

@app.route('/workflow_step', methods=['POST'])
def add_or_update_workflow_step():
    data = request.json
    print("Received data from the client for workflow:", data)
    task_id = data['task_id']
    workflow_step_name = data['workflow_step_name']
    category = data['category']  # Add this line
    likes = data.get('likes', None)

    workflow_step = WorkflowStep.query.filter_by(task_id=task_id, name=workflow_step_name, category=category).first()

    tool_description = data.get('tool_description',None)
    huggingface_url = data.get('huggingface_url', None)
    github_url = data.get('github_url', None) # Add this line
    chatgpt_prompt = data.get('chatgpt_prompt',None)
    research_description = data.get('research_description',None)
    research_url = data.get('research_url',None)

    if not workflow_step:
        new_workflow_step = WorkflowStep(name=workflow_step_name, task_id=task_id, category=category,tool_description=tool_description,huggingface_url=huggingface_url, github_url=github_url,chatgpt_prompt=chatgpt_prompt,research_description=research_description,research_url=research_url) # Add github_url here
        db.session.add(new_workflow_step)
        db.session.commit()
        return jsonify({'result': 'success', 'workflow_step_id': new_workflow_step.id})
    else:
        if likes is not None:
            workflow_step.likes = likes
            workflow_step.github_url = github_url # Add this line
            db.session.commit()
        return jsonify({'result': 'success', 'workflow_step_id': workflow_step.id})

@app.route('/workflow_step/<int:workflow_step_id>', methods=['DELETE'])
def delete_workflow_step(workflow_step_id):
    workflow_step = WorkflowStep.query.get_or_404(workflow_step_id)

    try:
        db.session.delete(workflow_step)
        db.session.commit()
        return jsonify({'result': 'success'})
    except:
        return jsonify({'result': 'error', 'message': 'There was an issue deleting the workflow step'})

@app.route('/test')
def test():
    return "Test route is working!"

if __name__ == "__main__":
    with app.app_context():
        db.create_all()

        task_to_delete = None
        if task_to_delete:
            db.session.delete(task_to_delete)
            db.session.commit()

    app.run()





    
    

