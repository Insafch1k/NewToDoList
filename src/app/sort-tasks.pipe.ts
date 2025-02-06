import { Pipe, PipeTransform } from '@angular/core';
import { Task } from './task.model';

@Pipe({
  name: 'sortTasks'
})
export class SortTasksPipe implements PipeTransform {
  transform(tasks: Task[], sortOption: string): Task[] {
    switch (sortOption) {
      case "newest":
        return tasks.sort((a, b) =>
          new Date(b.creation_date).getTime() - new Date(a.creation_date).getTime()
        );
      case "oldest":
        return tasks.sort((a, b) =>
          new Date(a.creation_date).getTime() - new Date(b.creation_date).getTime()
        );
      case "closest":
        return tasks.sort((a, b) =>
          new Date(a.execution_date).getTime() - new Date(b.execution_date).getTime()
        );
      case "farthest":
        return tasks.sort((a, b) =>
          new Date(b.execution_date).getTime() - new Date(a.execution_date).getTime()
        );
      default:
        return tasks;
    }
  }
}