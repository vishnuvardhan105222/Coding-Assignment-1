const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isMatch = require('date-fns/isMatch')

const app = express()
app.use(express.json())

let database

const initializeDBandServer = async () => {
  try {
    database = await open({
      filename: path.join(__dirname, 'todoApplication.db'),
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is Running on http://localhost:3000/')
    })
  } catch (error) {
    console.log(`Database error is ${error.message}`)
    process.exit(1)
  }
}

initializeDBandServer()

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

const hasCategoryAndStatusProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCategoryAndPriorityProperties = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearchProperty = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCategoryProperty = requestQuery => {
  return requestQuery.category !== undefined
}

const outputResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''

  const {search_q = '', priority, status, category} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        if (['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
          getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`
          data = await database.all(getTodosQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400).send('Invalid Todo Status')
        }
      } else {
        response.status(400).send('Invalid Todo Priority')
      }
      break

    case hasCategoryAndStatusProperties(request.query):
      if (['WORK', 'HOME', 'LEARNING'].includes(category)) {
        if (['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`
          data = await database.all(getTodosQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400).send('Invalid Todo Status')
        }
      } else {
        response.status(400).send('Invalid Todo Category')
      }
      break

    case hasCategoryAndPriorityProperties(request.query):
      if (['WORK', 'HOME', 'LEARNING'].includes(category)) {
        if (['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
          getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`
          data = await database.all(getTodosQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400).send('Invalid Todo Priority')
        }
      } else {
        response.status(400).send('Invalid Todo Category')
      }
      break

    case hasPriorityProperty(request.query):
      if (['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
        getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}';`
        data = await database.all(getTodosQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400).send('Invalid Todo Priority')
      }
      break

    case hasStatusProperty(request.query):
      if (['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`
        data = await database.all(getTodosQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400).send('Invalid Todo Status')
      }
      break

    case hasSearchProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
      data = await database.all(getTodosQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
      break

    case hasCategoryProperty(request.query):
      if (['WORK', 'HOME', 'LEARNING'].includes(category)) {
        getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`
        data = await database.all(getTodosQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400).send('Invalid Todo Category')
      }
      break

    default:
      getTodosQuery = `SELECT * FROM todo;`
      data = await database.all(getTodosQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`
  const responseResult = await database.get(getTodoQuery)
  response.send(outputResult(responseResult))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (isMatch(date, 'yyyy-MM-dd')) {
    const newDate = format(new Date(date), 'yyyy-MM-dd')
    const getTodosQuery = `SELECT * FROM todo WHERE due_date = '${newDate}';`
    const data = await database.all(getTodosQuery)
    response.send(data.map(eachItem => outputResult(eachItem)))
  } else {
    response.status(400).send('Invalid Due Date')
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
    if (['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
      if (['WORK', 'HOME', 'LEARNING'].includes(category)) {
        if (isMatch(dueDate, 'yyyy-MM-dd')) {
          const postNewDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodoQuery = `
            INSERT INTO 
            todo (id, todo, category, priority, status, due_date)
            VALUES (${id}, '${todo}', '${category}', '${priority}', '${status}', '${postNewDueDate}');`
          await database.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400).send('Invalid Due Date')
        }
      } else {
        response.status(400).send('Invalid Todo Category')
      }
    } else {
      response.status(400).send('Invalid Todo Status')
    }
  } else {
    response.status(400).send('Invalid Todo Priority')
  }
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body

  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const previousTodo = await database.get(previousTodoQuery)

  const updatedTodo = {
    todo: todo !== undefined ? todo : previousTodo.todo,
    priority: priority !== undefined ? priority : previousTodo.priority,
    status: status !== undefined ? status : previousTodo.status,
    category: category !== undefined ? category : previousTodo.category,
    dueDate: dueDate !== undefined ? dueDate : previousTodo.due_date,
  }

  if (
    updatedTodo.priority &&
    !['HIGH', 'MEDIUM', 'LOW'].includes(updatedTodo.priority)
  ) {
    response.status(400).send('Invalid Todo Priority')
    return
  }

  if (
    updatedTodo.status &&
    !['TO DO', 'IN PROGRESS', 'DONE'].includes(updatedTodo.status)
  ) {
    response.status(400).send('Invalid Todo Status')
    return
  }

  if (
    updatedTodo.category &&
    !['WORK', 'HOME', 'LEARNING'].includes(updatedTodo.category)
  ) {
    response.status(400).send('Invalid Todo Category')
    return
  }

  if (updatedTodo.dueDate && !isMatch(updatedTodo.dueDate, 'yyyy-MM-dd')) {
    response.status(400).send('Invalid Due Date')
    return
  }

  let updateTodoQuery = 'UPDATE todo SET '
  const fieldsToUpdate = []
  const paramsToUpdate = []

  if (todo !== undefined) {
    fieldsToUpdate.push('todo = ?')
    paramsToUpdate.push(todo)
  }
  if (priority !== undefined) {
    fieldsToUpdate.push('priority = ?')
    paramsToUpdate.push(priority)
  }
  if (status !== undefined) {
    fieldsToUpdate.push('status = ?')
    paramsToUpdate.push(status)
  }
  if (category !== undefined) {
    fieldsToUpdate.push('category = ?')
    paramsToUpdate.push(category)
  }
  if (dueDate !== undefined) {
    fieldsToUpdate.push('due_date = ?')
    paramsToUpdate.push(format(new Date(dueDate), 'yyyy-MM-dd'))
  }

  updateTodoQuery += fieldsToUpdate.join(', ')
  updateTodoQuery += ' WHERE id = ?'
  paramsToUpdate.push(todoId)

  await database.run(updateTodoQuery, paramsToUpdate)

  let responseMessage = 'Todo Updated'
  if (
    priority !== undefined &&
    todo === undefined &&
    status === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    responseMessage = 'Priority Updated'
  }
  if (
    status !== undefined &&
    todo === undefined &&
    priority === undefined &&
    category === undefined &&
    dueDate === undefined
  ) {
    responseMessage = 'Status Updated'
  }
  if (
    category !== undefined &&
    todo === undefined &&
    priority === undefined &&
    status === undefined &&
    dueDate === undefined
  ) {
    responseMessage = 'Category Updated'
  }
  if (
    dueDate !== undefined &&
    todo === undefined &&
    priority === undefined &&
    status === undefined &&
    category === undefined
  ) {
    responseMessage = 'Due Date Updated'
  }

  response.send(responseMessage)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`
  await database.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
