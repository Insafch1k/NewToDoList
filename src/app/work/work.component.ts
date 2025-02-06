import { Component, OnInit, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { TaskService } from '../task.service';
import { Task, Users, CreateTask, UserCreate, SearchQuery, UpdateTaskUsers,getUserId  } from '../task.model';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss']
})
export class WorkComponent implements OnInit {
  @ViewChild('inputElement', { static: false }) inputElement!: ElementRef;

  tasks: Task[] = [];
  users: Users[] = [];
  currentTask: string = '';
  taskCreationDate: string = '';
  taskExecutionDate: string = '';
  todayDate: string | undefined;
  showModal: boolean = false;
  showEditModal: boolean = false;
  showUsersModal: boolean = false;
  showDeleteConfirmation: boolean = false;
  performers: string[] = [];
  selectedPerformers: number[] = [];
  selectedPerformersForFilter: number[] = [];
  filteredTasks: Task[] = [];
  searchQuery: string = '';
  allPerformersLabel = 'Все исполнители';
  isDownloadOpen: boolean = false;
  isDropdown1Open: boolean | undefined;
  isDropdown2Open: boolean | undefined;
  isOpen: boolean = false;
  selectedItem: string | undefined;
  items: any[] = [];
  pdfContent: any;
  currentTaskId: number | null = null;
  newTaskDescription: string = '';
  startDate: string = '';
  endDate: string = '';
  editingTask: Task = new Task();
  newUserName: string = '';
  userToDelete: Users | null = null;
  showPrintOne: boolean = false; // Флаг для отображения модального окна
  currentDownloadTaskId: number | null = null; // ID текущей задачи для скачивания
  fontSize: number = 12; // Размер шрифта по умолчанию
  showUserDownloadModal: boolean = false; // Флаг для отображения модального окна
  currentUserId: number | null = null; // ID текущего пользователя
  sortOption: string = ''; // Добавим переменную для хранения текущего состояния сортировки
  sortDirection: 'asc' | 'desc' = 'asc'; // Направление сортировки
  

  constructor(private taskService: TaskService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const today = new Date();
  this.todayDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  
  if (!this.todayDate) {
    this.todayDate = ''; // Или любое другое значение по умолчанию
  }

  this.taskService.getTasks2().subscribe((data: any[]) => {
    this.tasks = data.map(taskArray => ({
      id: taskArray[0],
      title: taskArray[1],
      detail: taskArray[2],
      creation_date: taskArray[3],
      execution_date: taskArray[4],
      execution_mark: taskArray[5],
      executors: taskArray[6].split(', '), // Оставляем как массив строк
      isDropdownOpen: false
    }));

    this.filteredTasks = this.tasks;
  });

  this.loadUsers();
  }

  loadUsers() {
    this.taskService.getUsers().subscribe((usersData: any[]) => {
      this.users = usersData.map(userArray => ({
        id: userArray[0],
        username: userArray[1],
        selectedForNewTask: false,
        selectedForEditTask: false,
        selectedForFilter: false
      }));
  
      console.log('Loaded Users:', this.users); // Логируем загруженных пользователей
      this.performers = this.users.map(user => user.username || '');
    });
  }

  onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.applyFilters();
  }

  
  sortBy(column: string) {
    if (this.sortOption === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortOption = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.tasks];
  
    if (this.searchQuery || this.selectedPerformersForFilter.length > 0) {
      const params = new HttpParams();
      if (this.searchQuery) {
        params.append('query', this.searchQuery);
      }
      if (this.selectedPerformersForFilter.length > 0) {
        this.selectedPerformersForFilter.forEach(id => {
          params.append('executors_id', id.toString());
        });
      }
  
      this.taskService.filterTasksByUsers2(this.selectedPerformersForFilter).subscribe((data: any[]) => {
        filtered = data.map(taskArray => ({
          id: taskArray[0],
          title: taskArray[1],
          detail: taskArray[2],
          creation_date: taskArray[3],
          execution_date: taskArray[4],
          execution_mark: taskArray[5],
          executors: taskArray[6].split(', '),
          isDropdownOpen: false
        }));
        this.filteredTasks = filtered;
      }, error => {
        console.error('Error filtering tasks', error);
      });
    } else {
      this.filteredTasks = filtered;
    }
  
    if (this.sortOption) {
      filtered.sort((a, b) => {
        if (this.sortOption === 'id' || this.sortOption === 'creation_date' || this.sortOption === 'execution_date') {
          const dateA = new Date(a[this.sortOption]).getTime();
          const dateB = new Date(b[this.sortOption]).getTime();
          return this.sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (this.sortOption === 'title' || this.sortOption === 'executors') {
          const valueA = a[this.sortOption].toString().toLowerCase();
          const valueB = b[this.sortOption].toString().toLowerCase();
          return this.sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        }
        return 0;
      });
    }
  
    this.filteredTasks = filtered;
  }

  isPerformerSelected(performer: string): boolean {
    const performerId = this.users.find(user => user.username === performer)?.id;
    return performerId !== undefined && this.selectedPerformers.includes(performerId);
  }

  togglePerformerSelection(performer: string | undefined) {
    if (!performer) return; // Прерываем выполнение, если performer не определён
    const performerId = this.users.find(user => user.username === performer)?.id;
    if (performerId !== undefined) {
      if (this.selectedPerformers.includes(performerId)) {
        this.selectedPerformers = this.selectedPerformers.filter(id => id !== performerId);
      } else {
        this.selectedPerformers.push(performerId);
      }
    }
  }

  isPerformerSelectedForFilter(performer: string): boolean {
    const performerId = this.users.find(user => user.username === performer)?.id;
    return performerId !== undefined && this.selectedPerformersForFilter.includes(performerId);
  }

  togglePerformerSelectionForFilter(performer: string | undefined) {
    if (performer) {
        console.log('togglePerformerSelectionForFilter called with performer:', performer);
        const performerId = this.users.find(user => user.username === performer)?.id;
        if (performerId !== undefined) {
            if (this.selectedPerformersForFilter.includes(performerId)) {
                this.selectedPerformersForFilter = this.selectedPerformersForFilter.filter(id => id !== performerId);
            } else {
                this.selectedPerformersForFilter.push(performerId);
            }
        }
        this.applyFilters();
    }
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const dropdown = document.querySelector('.dropdown-menu');
    if (dropdown && !dropdown.contains(event.target as Node)) {
      this.isOpen = false;
    }
  }

  toggleModuleDownload(){
    this.isDownloadOpen = !this.isDownloadOpen;
  }

  openModal() {
    this.showModal = true;
  
    // Устанавливаем сегодняшнюю дату по умолчанию
    this.startDate = this.todayDate ?? ''; // Если todayDate undefined, используем пустую строку
    this.endDate = this.todayDate ?? ''; // Если todayDate undefined, используем пустую строку
  }

  closeModal(event: MouseEvent) {
    this.showModal = false;
  }

  openDownloadSizeModal(taskId: number) {
    this.currentDownloadTaskId = taskId;
    this.showPrintOne = true;
  }
  
  closeDownloadSizeModal() {
    this.currentDownloadTaskId = null;
    this.fontSize = 12; // Сброс значения размера шрифта
    this.showPrintOne = false;
  }

  openEditModal(task: Task) {
    this.editingTask = { ...task }; // Копируем задачу для редактирования
    this.currentTaskId = task.id !== undefined ? task.id : null;
  
    if (this.currentTaskId !== null) {
      console.log('Fetching executors for task ID:', this.currentTaskId);
  
      // Получаем исполнителей задачи с сервера
      this.taskService.getTaskExecutors(this.currentTaskId).subscribe((executors: getUserId[]) => {
        console.log('Task Executors Response:', executors); // Логируем ответ сервера
  
        if (!executors || executors.length === 0) {
          console.warn('No executors found for the task');
          this.selectedPerformers = [];
        } else {
          // Инициализируем selectedPerformers на основе полученных исполнителей
          this.selectedPerformers = executors.map(executor => executor.id!);
          console.log('Selected Performers:', this.selectedPerformers); // Логируем выбранных исполнителей
  
          // Сопоставляем исполнителей с пользователями
          this.users.forEach(user => {
            user.selectedForEditTask = this.selectedPerformers.includes(user.id);
          });
  
          console.log('Users with selectedForEditTask:', this.users); // Логируем состояние пользователей
        }
  
        this.showEditModal = true; // Открываем модальное окно
      }, error => {
        console.error('Error fetching task executors:', error); // Логируем ошибку, если она возникает
      });
    } else {
      console.error('currentTaskId is null');
    }
  }

  closeEditModal(event: MouseEvent) {
    this.showEditModal = false;
  }

  openUsersModal() {
    this.showUsersModal = true;
  }

  closeUsersModal(event: MouseEvent) {
    this.showUsersModal = false;
  }

  confirmDeleteUser(user: Users) {
    this.userToDelete = user;
    this.showDeleteConfirmation = true;
  }

  closeDeleteConfirmation(event: MouseEvent) {
    this.showDeleteConfirmation = false;
    this.userToDelete = null;
  }

  deleteUser() {
    if (this.userToDelete) {
      this.taskService.deleteUser(this.userToDelete.id!).subscribe(() => {
        this.loadUsers();
        this.closeDeleteConfirmation(new MouseEvent('click'));
      });
    }
  }

  addUser() {
    if (this.newUserName) {
      const user: UserCreate = { username: this.newUserName };
      this.taskService.createUser(user).subscribe(
        response => {
          console.log('User created successfully', response);
  
          // Очищаем поле ввода
          this.newUserName = '';
          if (this.inputElement && this.inputElement.nativeElement) {
            this.inputElement.nativeElement.value = ''; // Очистить значение input
          }
  
          // Обновляем список пользователей
          this.loadUsers();
  
          // Принудительно обновляем представление
          this.cdr.detectChanges();
  
        },
        error => {
          console.error('Error creating user', error);
        }
      );
    } else {
      console.error('Username is required');
    }
  }

  createNewTask() {
    const newTask: CreateTask = {
      title: this.newTaskDescription,
      detail: "нет",
      executors: this.selectedPerformers,
      creation_date: this.startDate,
      execution_date: this.endDate,
      execution_mark: 'В работе',
    };
  
    this.taskService.createTask(newTask).subscribe(
      () => {
        console.log('Task created successfully');
  
        // Перезагружаем список задач
        this.loadTasks();
  
        // Закрываем модальное окно
        this.closeModal(new MouseEvent('click'));
  
        // Очищаем поля формы
        this.newTaskDescription = '';
        this.startDate = '';
        this.endDate = '';
        this.selectedPerformers = [];
      },
      (error) => {
        console.error('Error creating task', error);
      }
    );
  }
  
  loadTasks() {
    this.taskService.getTasks2().subscribe((data: any[]) => {
      this.tasks = data.map(taskArray => ({
        id: taskArray[0],
        title: taskArray[1],
        detail: taskArray[2],
        creation_date: taskArray[3],
        execution_date: taskArray[4],
        execution_mark: taskArray[5],
        executors: taskArray[6].split(', '),
        isDropdownOpen: false,
      }));
      this.filteredTasks = [...this.tasks]; // Обновляем отфильтрованный список
    });
  }

  saveEditedTask() {
    if (this.editingTask.id !== undefined) {
      const updatedTask = {
        title: this.editingTask.title,
        detail: 'нет',
        creation_date: this.editingTask.creation_date,
        execution_date: this.editingTask.execution_date,
        execution_mark: this.editingTask.execution_mark
      };

      this.taskService.updateTask(this.editingTask.id, updatedTask).subscribe(response => {
        console.log('Task updated successfully', response);
        this.closeEditModal(new MouseEvent('click'));
        this.applyFilters();
      }, error => {
        console.error('Error updating task', error);
      });
    }
  }

  openRedactor(task: Task) {
    this.editingTask = { ...task };
    this.showEditModal = true;
  }

  closeRedactor(event: MouseEvent) {
    this.showEditModal = false;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Готово':
        return 'status-ready';
      case 'В работе':
        return 'status-progress';
      default:
        return '';
    }
  }

  toggleDropdown1() {
    this.isDropdown1Open = !this.isDropdown1Open;
  }

  selectPerformer1(performer: string) {
    const performerId = this.users.find(user => user.username === performer)?.id;
    if (performerId !== undefined) {
      this.selectedPerformers.push(performerId);
    }
    this.isDropdown1Open = false;
  }

  toggleDropdown2() {
    this.isDropdown2Open = !this.isDropdown2Open;
  }

  selectPerformer2(performer: string) {
    const performerId = this.users.find(user => user.username === performer)?.id;
    if (performerId !== undefined) {
      this.selectedPerformers.push(performerId);
    }
    this.isDropdown2Open = false;
  }

  // downloadFile(taskId: number) {
  //   if (taskId !== undefined) {
  //     this.taskService.downloadFile(taskId).subscribe(blob => {
  //       const url = window.URL.createObjectURL(blob);
  //       const a = document.createElement('a');
  //       a.href = url;
  //       a.download = 'Таткоммунэнерго.pdf';
  //       document.body.appendChild(a);
  //       a.click();
  //       document.body.removeChild(a);
  //       window.URL.revokeObjectURL(url);
  //     });
  //   }
  // }


  
  
  
  

  deleteTask(taskId: number) {
    if (taskId !== undefined) {
      this.taskService.deleteTask(taskId).subscribe(() => {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.applyFilters();
      });
    }
  }

  toggleStatusDropdown(task: Task) {
    task.isDropdownOpen = !task.isDropdownOpen;
  }

  updateStatus(task: Task, status: string) {
    task.execution_mark = status;
    task.isDropdownOpen = false;
    this.taskService.updateTaskStatus(task.id!, status).subscribe(() => {
      this.applyFilters();
    }, error => {
      console.error('Error updating task status', error);
    });
  }

  saveTask() {
    console.log('saveTask called');
    if (this.currentTaskId !== null) {
      const updatedTask = {
        title: this.currentTask,
        detail: 'нет',
        creation_date: this.taskCreationDate,
        execution_date: this.taskExecutionDate,
        execution_mark: this.tasks.find(task => task.id === this.currentTaskId)?.execution_mark || ''
      };

      console.log('Updated task:', updatedTask);

      this.taskService.updateTask(this.currentTaskId, updatedTask).subscribe(response => {
        console.log('Task updated successfully', response);
        this.closeRedactor(new MouseEvent('click'));
      }, error => {
        console.error('Error updating task', error);
      });
    } else {
      console.error('currentTaskId is null');
    }
  }

  savePerformers() {
    console.log('savePerformers called');
    if (this.currentTaskId !== null) {
      const updatedPerformers: UpdateTaskUsers = {
        executors: this.selectedPerformers
      };

      console.log('Updated performers:', updatedPerformers);

      this.taskService.updateTaskExecutors(this.currentTaskId, updatedPerformers).subscribe(response => {
        console.log('Task performers updated successfully', response);
        this.closeRedactor(new MouseEvent('click'));
      }, error => {
        console.error('Error updating task performers', error);
      });
    } else {
      console.error('currentTaskId is null');
    }
  }

  filterTasksByPerformers() {
    if (this.selectedPerformersForFilter.length > 0) {
      this.taskService.filterTasksByUsers2(this.selectedPerformersForFilter).subscribe((data: any[]) => {
        this.filteredTasks = data.map(taskArray => ({
          id: taskArray[0],
          title: taskArray[1],
          detail: taskArray[2],
          creation_date: taskArray[3],
          execution_date: taskArray[4],
          execution_mark: taskArray[5],
          executors: taskArray[6].split(', '),
          isDropdownOpen: false
        }));
      });
    } else {
      this.filteredTasks = this.tasks;
    }
  }
  openUserDownloadModal(userId: number) {
    this.currentUserId = userId;
    this.showUserDownloadModal = true;
  }
  
  closeUserDownloadModal() {
    this.currentUserId = null;
    this.fontSize = 12; // Сброс значения размера шрифта
    this.showUserDownloadModal = false;
  }
  downloadUserTasksWithFontSize() {
    if (this.currentUserId !== null && this.fontSize > 0) {
      this.taskService.downloadUserTasksWithFontSize(this.currentUserId, this.fontSize).subscribe(
        (response: Blob) => {
          const url = window.URL.createObjectURL(response);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.users.find(user => user.id === this.currentUserId)?.username}_tasks.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
  
          this.closeUserDownloadModal(); // Закрываем модальное окно после скачивания
        },
        (error) => {
          console.error('Error downloading user tasks', error);
        }
      );
    } else {
      console.error('Invalid font size or user ID');
    }
  }

  downloadFileWithFontSize(taskId: number) {
    if (taskId !== undefined && this.fontSize > 0) {
        const downloadRequest = {
            text_size: this.fontSize // Передаём размер шрифта
        };

        this.taskService.downloadFileWithFontSize(taskId, downloadRequest).subscribe(
            (response: any) => {
                let blob: Blob;
                let filename: string;

                // Если сервер возвращает Blob
                if (response.body instanceof Blob) {
                    blob = response.body;
                    filename = this.extractFilenameFromHeaders(response) || 'Таткоммунэнерго.pdf';
                } else {
                    console.error('Unexpected server response:', response);
                    return;
                }

                this.saveBlobAsFile(blob, filename);
                this.closeDownloadSizeModal(); // Закрываем модальное окно после скачивания
            },
            (error) => {
                console.error('Error downloading file', error);
            }
        );
    } else {
        console.error('Invalid font size or task ID');
    }
}
private extractFilenameFromHeaders(response: any): string | null {
  const contentDisposition = response.headers.get('Content-Disposition');

  if (contentDisposition) {
      // Парсим Content-Disposition для извлечения filename
      const match = contentDisposition.match(/filename=["']?([^"']+)/);
      if (match && match[1]) {
          return match[1]; // Возвращаем оригинальное имя файла (KP_102.pdf)
      }
  }

  return null;
}
private saveBlobAsFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;

  // Устанавливаем имя файла через атрибут download
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
}
