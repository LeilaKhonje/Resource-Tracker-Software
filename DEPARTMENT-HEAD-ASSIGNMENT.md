# Assigning a Department Head

The app already supports assigning the `department_head` role through
`PATCH /users/:id/role`. What is missing is linking that user to a specific
department. The cleanest approach is to add an optional department relationship
to `User`, then add a managing-director-only endpoint that sets both the role
and department together.

1. **Add the relationship.** In `User`, add a nullable `ManyToOne` relation to
   `Department` with a `department_id` foreign key. A nullable relation allows
   newly registered or unassigned users to remain unassigned. In `Department`,
   add the inverse `OneToMany` relation if you want to navigate from a
   department to its head(s). The foreign key makes a head’s department
   association persist; it does not, by itself, enforce that each department
   has at most one head.

2. **Add an assignment endpoint.** For example,
   `PATCH /departments/:departmentId/head` with a body containing `userId`.
   Protect it with `JwtAuthGuard`, `RolesGuard`, and
   `@Roles(UserRole.MANAGING_DIRECTOR)`. In the service, confirm both records
   exist, set the user’s role to `department_head`, associate the user with the
   department, and save. Returning the updated user and department makes the
   result easy for the client to confirm.

3. **Decide the assignment rules.** If each department should have one head,
   decide what happens when a new head is assigned: replace the old one, or
   reject the assignment. If a head can manage only one department, a
   `ManyToOne` user-to-department relation fits. If a head can manage several
   departments, use a many-to-many relation instead.

4. **Update the department response.** Have `GET /departments` include the
   head’s basic public details—such as ID, name, and email—so the UI can show
   who is assigned. Don’t return password hashes or other private fields.

5. **Handle schema changes.** Update the database schema using the project’s
   migration or synchronization approach, and consider what should happen to
   the department link if a user or department is deleted.

The relevant starting points are
[`src/departments/entities/department.entity.ts`](src/departments/entities/department.entity.ts),
[`src/users/user.entity.ts`](src/users/user.entity.ts), and
[`src/departments/departments.controller.ts`](src/departments/departments.controller.ts).
The existing role endpoint can remain for role-only assignments, but the new
department-head workflow should set the role and department together to avoid a
head with no assigned department.
