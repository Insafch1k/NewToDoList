import { HttpClient, HttpParams,HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Task, Users, CreateTask, UserCreate, UpdateStatus, getUserId, SearchQuery, UpdateTaskUsers, UserResponse } from './task.model';

const API = "http://192.168.1.238:6200";

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  constructor(private http: HttpClient) { }

  // Метод для получения всех задач
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API}/tasks/`).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для получения всех задач в ожидании
  getTasks1(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API}/tasks/status1`).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для получения всех задач в работе
  getTasks2(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API}/tasks/status2`).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для получения всех задач готово
  getTasks3(): Observable<Task[]> {
    return this.http.get<Task[]>(`${API}/tasks/status3`).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для получения всех пользователей
  getUsers(): Observable<Users[]> {
    return this.http.get<Users[]>(`${API}/users`).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для создания новой задачи
  // createTask(task: CreateTask): Observable<Task> {
  //   return this.http.post<Task>(`${API}/tasks/create`, task).pipe(
  //     catchError(this.handleError)
  //   );
  // }
  createTask(task: CreateTask): Observable<Task> {
    return this.http.post<Task>(`${API}/tasks/create`, task).pipe(
      tap(response => console.log('Server response after creating task:', response)),
      catchError(error => {
        console.error('Error creating task', error);
        return throwError(error);
      })
    );
  }

  // Метод для удаления задачи
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/tasks/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // // Метод для скачивания файла
  // downloadFile(id: number): Observable<Blob> {
  //   return this.http.get(`${API}/tasks/${id}/download`, { responseType: 'blob' }).pipe(
  //     catchError(this.handleError)
  //   );
  // }
    // Метод для скачивания файла с указанием размера шрифта
    // Метод для скачивания файла с указанием размера шрифта
  // Метод для скачивания файла с указанием размера шрифта
  downloadFileWithFontSize(id: number, request: { text_size: number }): Observable<HttpResponse<Blob>> {
    const url = `${API}/tasks/${id}/download`;

    return this.http.post<Blob>(url, request, {
      observe: 'response',
      responseType: 'blob' as 'json'
    }).pipe(
      tap(response => {
        console.log('Backend Response for Download File:', response);
        // Логируем все заголовки
        response.headers.keys().forEach(key => {
          console.log(`${key}: ${response.headers.get(key)}`);
        });
      }),
      catchError(this.handleError)
    );
  }
    
    
  // Метод для создания нового пользователя
  createUser(user: UserCreate): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${API}/users/create`, user).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для обновления статуса задачи
  updateTaskStatus(id: number, status: string): Observable<void> {
    const updateStatus: UpdateStatus = { status };
    return this.http.patch<void>(`${API}/tasks/${id}`, updateStatus).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для обновления задачи
  updateTask(id: number, updatedTask: any): Observable<void> {
    return this.http.put<void>(`${API}/tasks/${id}/redact`, updatedTask).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для поиска задач по названию
  searchTasks(query: SearchQuery): Observable<Task[]> {
    return this.http.get<Task[]>(`${API}/tasks/search_tasks`, { params: { query: query.query } }).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для фильтрации задач по исполнителям (все)
  filterTasksByUsers(executors_id: number[]): Observable<Task[]> {
    let params = new HttpParams();
    executors_id.forEach(id => {
      params = params.append('executors_id', id.toString());
    });
    return this.http.get<Task[]>(`${API}/tasks/filter_users`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для фильтрации задач по исполнителям в ожидании
  filterTasksByUsers1(executors_id: number[]): Observable<Task[]> {
    let params = new HttpParams();
    executors_id.forEach(id => {
      params = params.append('executors_id', id.toString());
    });
    return this.http.get<Task[]>(`${API}/tasks/status1/filter_users`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для фильтрации задач по исполнителям в работе
  filterTasksByUsers2(executors_id: number[]): Observable<Task[]> {
    let params = new HttpParams();
    executors_id.forEach(id => {
      params = params.append('executors_id', id.toString());
    });
    return this.http.get<Task[]>(`${API}/tasks/status2/filter_users`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для фильтрации задач по исполнителям готово
  filterTasksByUsers3(executors_id: number[]): Observable<Task[]> {
    let params = new HttpParams();
    executors_id.forEach(id => {
      params = params.append('executors_id', id.toString());
    });
    return this.http.get<Task[]>(`${API}/tasks/status3/filter_users`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для обновления исполнителей задачи
  updateTaskExecutors(id: number, updatedPerformers: UpdateTaskUsers): Observable<void> {
    return this.http.put<void>(`${API}/tasks/${id}/redact_users`, updatedPerformers).pipe(
      catchError(this.handleError)
    );
  }

  // Метод для получения исполнителей задачи
  getTaskExecutors(id: number): Observable<getUserId[]> {
    return this.http.get<any[]>(`${API}/tasks/${id}/redact_users`).pipe(
      map((response: any[]) => response.map(item => ({ id: item[0], username: item[1] }))),
      tap((response: getUserId[]) => {
        console.log('Task Executors from API:', response); // Логируем данные от сервера
      }),
      catchError(this.handleError)
    );
  }

  // Метод для скачивания всех задач исполнителя
  // downloadUserTasks(userId: number): Observable<Blob> {
  //   return this.http.get(`${API}/tasks/${userId}/user_tasks_pdf`, { responseType: 'blob' }).pipe(
  //     catchError(this.handleError)
  //   );
  // }

  // Метод для скачивания всех задач исполнителя с указанием размера шрифта
  // downloadUserTasksWithFontSize(userId: number, request: { text_size: number }): Observable<any> {
  //   return this.http.post(`${API}/tasks/user_tasks_pdf`, request, { responseType: 'blob' }).pipe(
  //     tap(response => console.log('Backend Response for User Tasks Download:', response)), // Логируем ответ сервера
  //     catchError(this.handleError)
  //   );
  // }

  // Метод для скачивания всех задач исполнителя с указанием размера шрифта
  downloadUserTasksWithFontSize(userId: number, fontSize: number): Observable<Blob> {
    const url = `${API}/tasks/${userId}/user_tasks_pdf`;
    const body = { text_size: fontSize };
  
    return this.http.post(url, body, { responseType: 'blob' }).pipe(
      tap(response => console.log('Backend Response for User Tasks Download:', response)),
      catchError(this.handleError)
    );
  }
  
  

  // Метод для удаления пользователя
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${API}/users/${id}`).pipe(
      catchError(this.handleError)
    );
  }


  private handleError(error: any): Observable<never> {
    console.error('An error occurred', error);
    return throwError(error.message || error);
  }
}

