#! /usr/bin/env node
import  inquirer from 'inquirer';
import * as fs from 'fs';

interface Todo {
  text: string;
  done: boolean;
}

interface State {
  todos: Todo[];
}

const stateFile = 'state.json';
function readState(): State {
  try {
    const data = fs.readFileSync(stateFile, 'utf8');
    return JSON.parse(data);
  } catch {
    return { todos: [] };
  }
}

function writeState(state: State) {
  const data = JSON.stringify(state);
  fs.writeFileSync(stateFile, data);
}

function promptTodo(): Promise<Todo> {
  return inquirer.prompt({
    type: 'input',
    name: 'text',
    message: 'Enter todo text:'
  }).then(answers => ({
    text: answers.text,
    done: false
  }));
}

function promptTodos(state: State): Promise<State> {
  return inquirer.prompt([{
    type: 'list',
    name: 'command',
    message: 'Select command:',
    choices: [
      { name: 'Add todo', value: 'add' },
      ...(state.todos.map((todo, i) => ({
        name: `${todo.done ? '[x]' : '[ ]'} ${todo.text}`,
        value: i.toString()
      }))),
      { name: 'Quit', value: 'quit' }
    ]
  }]).then(answers => {
    switch (answers.command) {
      case 'add':
        return promptTodo().then(todo => ({
          todos: [...state.todos, todo]
        }));
      case 'quit':
        return state;
      default:
        const i = parseInt(answers.command);
        const todos = [...state.todos];
        todos[i].done = !todos[i].done;
        return { todos };
    }
  });
}

async function run() {
  let state = readState();
  while (true) {
    state = await promptTodos(state);
    writeState(state);
    if (state.todos.length === 0) {
      console.log('No todos left. Goodbye!');
      break;
    }
  }
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
