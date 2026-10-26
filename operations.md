#Resource Tracker Backend Workflow

Firstly, a user register and that user is registered as the managing director.
The subsequent users that register after the managing director, their roles are set to null.
Then, the managing director creates departments and assigns department heads to each department.
The department heads are the ones responsible for creating teams and projects in their respective departments, They first create a team and they create a project and assign the project to a team. Each team must have a team lead, so the department heads assign a team lead role to a user and assign the team lead to a team.

The managing director also assigns the line manager role to other users and these ones are not affliated with any department.
