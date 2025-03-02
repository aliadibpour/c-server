import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ChangeStatusDto, CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoEntity } from './entities/todo.entity';
import { uuid } from 'uuidv4';


@Injectable()
export class TodoService {
  private taskList: TodoEntity[] = [];
  createTask(task: CreateTodoDto) {
    console.log('Created->', task);
    if (!task || !task.title || !task.description || !task.status) {
      throw new BadRequestException(
        'Invalid task data. Please provide title, description, and status.',
      );
    }
    const todo: TodoEntity = {
      id: uuid(),
      title: task.title,
      description: task.description,
      status: task.status,
    };
    this.taskList.push(todo);
    console.log('Created->', this.taskList);
    return todo;
  }

  getAllTasks(): TodoEntity[] {
    if (!this.taskList.length) {
      throw new NotFoundException(`No TODO list found.`);
    }
    return this.taskList;
  }

  getTaskById(id: string): TodoEntity {
    const task = this.taskList.find((task) => task.id === id);
    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
    return task;
  }

  getTasksByStatus(status: string): TodoEntity[] {
    return this.taskList.filter(task => task.status === status);
  }


  updateTaskStatus(id: string, changeStatusDto: ChangeStatusDto): TodoEntity {
    const task = this.getTaskById(id);
    if (!changeStatusDto || !changeStatusDto.status) {
      throw new BadRequestException(
        'Invalid status data. Please provide a valid status.',
      );
    }
    task.status = changeStatusDto.status;
    return task;
  }

  deleteTaskById(id: string): TodoEntity {
    const index = this.taskList.findIndex((task) => task.id === id);
    if (index !== -1) {
      const deletedTask = this.taskList.splice(index, 1)[0];
      return deletedTask;
    }
    throw new NotFoundException(`Task with ID ${id} not found`);
  }
}
