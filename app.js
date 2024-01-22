const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'todoApplication.db')

const app = express()
app.use(express.json())

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

//API 1
app.get('/todos/', async (request, response) => {
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
        SELECT * 
        FROM todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}'
          AND status = '${status}';
      `
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
        SELECT * 
        FROM todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND priority = '${priority}';
      `
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
        SELECT * 
        FROM todo
        WHERE 
          todo LIKE '%${search_q}%'
          AND status = '${status}';
      `
      break
    default:
      getTodosQuery = `
        SELECT * 
        FROM todo
        WHERE 
          todo LIKE '%${search_q}%';
      `
  }
  data = await db.all(getTodosQuery)
  response.send(data)
})

//API 2 return specific todo based on todoId
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
    SELECT * 
    FROM todo
    WHERE id = ${todoId};
  `
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

//API 3 create todo in todotable
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const insertTodo = `
    INSERT INTO 
      todo (id, todo, priority, status)
    VALUES 
      (${id}, '${todo}', '${priority}', '${status}');
  `
  await db.run(insertTodo)
  response.send('Todo Successfully Added')
})

//API 4 update details of specific todo
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const body = request.body
  let updateTodo = ''
  switch (true) {
    case body.status !== undefined:
      updateTodo = 'Status'
      break
    case body.priority !== undefined:
      updateTodo = 'Priority'
      break
    case body.todo !== undefined:
      updateTodo = 'Todo'
      break
  }
  const firstTodoQuery = `
    SELECT * 
    FROM todo
    WHERE id = ${todoId};
  `
  const firstTodo = await db.run(firstTodoQuery)

  const {
    todo = firstTodo.todo,
    priority = firstTodo.priority,
    status = firstTodo.status,
  } = request.body

  const updatedQuery = `
    UPDATE todo
    SET 
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE id = ${todoId};
  `
  await db.run(updatedQuery)
  response.send(`${updateTodo} Updated`)
})

//API 5 delete todo from todo
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
    DELETE FROM 
      todo 
    WHERE id = ${todoId};
  `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
