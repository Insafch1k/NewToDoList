import { Component, OnInit, ViewChild, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { TaskService } from '../task.service';
import { Task, Users, CreateTask, UserCreate, SearchQuery, UpdateTaskUsers, getUserId } from '../task.model';
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
  showPrintOne: boolean = false;
  currentDownloadTaskId: number | null = null;
  fontSize: number = 12;
  showUserDownloadModal: boolean = false;
  currentUserId: number | null = null;
  sortOption: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  showStartCalendar: boolean = false;
  showEndCalendar: boolean = false;
  currentDate: Date = new Date();
  currentMonth: number = this.currentDate.getMonth();
  currentYear: number = this.currentDate.getFullYear();
  daysOfWeek: string[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  daysInMonth: (Date | null)[] = [];

  constructor(private taskService: TaskService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const today = new Date();
    this.todayDate = this.formatDateToEuropean(today);

    if (!this.todayDate) {
      this.todayDate = '';
    }

    this.taskService.getTasks2().subscribe((data: any[]) => {
      this.tasks = data.map(taskArray => ({
        id: taskArray[0],
        title: taskArray[1],
        detail: taskArray[2],
        creation_date: this.formatDateToEuropean(new Date(taskArray[3])),
        execution_date: this.formatDateToEuropean(new Date(taskArray[4])),
        execution_mark: taskArray[5],
        executors: taskArray[6].split(', '),
        isDropdownOpen: false
      }));

      this.filteredTasks = this.tasks;
    });

    this.loadUsers();
    const testDate = new Date('2023-10-05');
    console.log('Formatted Test Date:', this.formatDateToEuropean(testDate));
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

      console.log('Loaded Users:', this.users);
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
          creation_date: this.formatDateToEuropean(new Date(taskArray[3])),
          execution_date: this.formatDateToEuropean(new Date(taskArray[4])),
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
    if (!performer) return;
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

  const startCalendarElement = document.querySelector('.select-start .calendar');
  const endCalendarElement = document.querySelector('.select-end .calendar');

  // Проверяем, был ли клик вне области календаря
  if (startCalendarElement && !startCalendarElement.contains(event.target as Node)) {
    this.showStartCalendar = false;
  }
  if (endCalendarElement && !endCalendarElement.contains(event.target as Node)) {
    this.showEndCalendar = false;
  }
}

  toggleModuleDownload(){
    this.isDownloadOpen = !this.isDownloadOpen;
  }

  openModal() {
    this.showModal = true;

    this.startDate = this.todayDate ?? '';
    this.endDate = this.todayDate ?? '';
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
    this.fontSize = 12;
    this.showPrintOne = false;
  }

  openEditModal(task: Task) {
    this.editingTask = { ...task };
    this.currentTaskId = task.id !== undefined ? task.id : null;

    if (this.currentTaskId !== null) {
      this.taskService.getTaskExecutors(this.currentTaskId).subscribe((executors: getUserId[]) => {
        this.selectedPerformers = executors.map(executor => executor.id!);
        this.users.forEach(user => {
          user.selectedForEditTask = this.selectedPerformers.includes(user.id);
        });

        // Преобразуем строку даты в объект Date
        this.editingTask.creation_date = this.parseDateString(task.creation_date);
        this.editingTask.execution_date = this.parseDateString(task.execution_date);

        console.log('Editing Task:', this.editingTask);

        this.showEditModal = true;
        this.cdr.detectChanges();
      }, error => {
        console.error('Error fetching task executors:', error);
      });
    }
  }

  private parseDateString(dateString: string): string {
    const [day, month, year] = dateString.split('-');
    const date = new Date(+year, +month - 1, +day);
    return this.formatDateToEuropean(date);
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

        this.loadTasks();
      });
    }
  }

  addUser() {
    if (this.newUserName) {
      const user: UserCreate = { username: this.newUserName };
      this.taskService.createUser(user).subscribe(
        response => {
          console.log('User created successfully', response);

          this.newUserName = '';
          if (this.inputElement && this.inputElement.nativeElement) {
            this.inputElement.nativeElement.value = '';
          }

          this.loadUsers();

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
    // Проверяем, что описание задачи не пустое
    if (!this.newTaskDescription.trim()) {
      alert('Описание задачи не может быть пустым.');
      return;
    }

    // Проверяем, что выбрана хотя бы одна дата
    if (!this.startDate || !this.endDate) {
      alert('Пожалуйста, выберите даты начала и завершения задачи.');
      return;
    }

    // Проверяем, что дата завершения не раньше даты начала
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);
    if (end < start) {
      alert('Дата завершения не может быть раньше даты начала.');
      return;
    }

    // Проверяем, что выбран хотя бы один исполнитель
    if (this.selectedPerformers.length === 0) {
      alert('Пожалуйста, выберите хотя бы одного исполнителя.');
      return;
    }

    // Создаем новое задание
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
        console.log('Задача успешно создана');
        this.loadTasks();
        this.closeModal(new MouseEvent('click'));
        this.newTaskDescription = '';
        this.startDate = '';
        this.endDate = '';
        this.selectedPerformers = [];
      },
      (error) => {
        console.error('Ошибка при создании задачи', error);
        alert('Произошла ошибка при создании задачи. Пожалуйста, попробуйте снова.');
      }
    );
  }

  loadTasks() {
    this.taskService.getTasks2().subscribe((data: any[]) => {
      this.tasks = data.map(taskArray => ({
        id: taskArray[0],
        title: taskArray[1],
        detail: taskArray[2],
        creation_date: this.formatDateToEuropean(new Date(taskArray[3])),
        execution_date: this.formatDateToEuropean(new Date(taskArray[4])),
        execution_mark: taskArray[5],
        executors: taskArray[6].split(', '),
        isDropdownOpen: false,
      }));
      this.filteredTasks = [...this.tasks];
    });
  }

  saveEditedTask() {
    if (this.editingTask.id !== undefined) {
      if (!this.editingTask.title.trim()) {
        alert('Описание задачи не может быть пустым.');
        return;
      }

      if (!this.editingTask.creation_date || !this.editingTask.execution_date) {
        alert('Пожалуйста, выберите даты начала и завершения задачи.');
        return;
      }

      const updatedTask = {
        title: this.editingTask.title,
        detail: 'нет',
        creation_date: this.formatDateToISO(this.editingTask.creation_date),
        execution_date: this.formatDateToISO(this.editingTask.execution_date),
        execution_mark: this.editingTask.execution_mark,
        executors: this.selectedPerformers // Убедитесь, что этот список обновлен
      };

      this.taskService.updateTask(this.editingTask.id, updatedTask).subscribe(response => {
        console.log('Задача успешно обновлена', response);
        this.closeEditModal(new MouseEvent('click'));
        this.applyFilters();
        this.loadTasks();
      }, error => {
        console.error('Ошибка при обновлении задачи', error);
        alert('Произошла ошибка при сохранении задачи. Пожалуйста, проверьте данные и попробуйте снова.');
      });
    } else {
      console.error('ID задачи не определен');
    }
  }

  updateSelectedPerformers() {
    this.selectedPerformers = this.users
      .filter(user => user.selectedForEditTask)
      .map(user => user.id);
    console.log('Updated Selected Performers:', this.selectedPerformers);
  }

  toggleDatepicker(type: 'start' | 'end', event: MouseEvent) {
    event.stopPropagation(); // Предотвращаем всплытие события, чтобы оно не закрывало календарь сразу же
  
    if (type === 'start') {
      this.showStartCalendar = !this.showStartCalendar;
      this.showEndCalendar = false;
    } else {
      this.showEndCalendar = !this.showEndCalendar;
      this.showStartCalendar = false;
    }
  }
  
  

  generateCalendar() {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const endDay = lastDay.getDay() === 0 ? 6 : lastDay.getDay() - 1;

    this.daysInMonth = [];

    for (let i = 0; i < startDay; i++) {
      this.daysInMonth.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      this.daysInMonth.push(new Date(this.currentYear, this.currentMonth, day));
    }

    const remainingDays = 7 - (endDay + 1);
    for (let i = 0; i < remainingDays; i++) {
      this.daysInMonth.push(null);
    }
  }

  prevMonth(type: 'start' | 'end') {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    this.generateCalendar();
  }

  nextMonth(type: 'start' | 'end') {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    this.generateCalendar();
  }

  selectDate(day: Date | null, type: 'start' | 'end') {
    if (day) {
      if (type === 'start') {
        this.editingTask.creation_date = this.formatDateToEuropean(day);
        this.showStartCalendar = false;
      } else {
        this.editingTask.execution_date = this.formatDateToEuropean(day);
        this.showEndCalendar = false;
      }
    }
  }

  isSelectedDate(day: Date | null, type: 'start' | 'end'): boolean {
    if (!day) return false;
    if (type === 'start') {
      return this.editingTask.creation_date === this.formatDateToEuropean(day);
    } else {
      return this.editingTask.execution_date === this.formatDateToEuropean(day);
    }
  }

  get currentMonthName(): string {
    return new Date(this.currentYear, this.currentMonth).toLocaleString('ru-RU', { month: 'long' });
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
    const newStatus = task.execution_mark === 'Готово' ? 'В работе' : 'Готово';
    this.updateStatus(task, newStatus);
    this.loadTasks();
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
          creation_date: this.formatDateToEuropean(new Date(taskArray[3])),
          execution_date: this.formatDateToEuropean(new Date(taskArray[4])),
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
    this.fontSize = 12;
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

          this.closeUserDownloadModal();
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
            font_size: this.fontSize
        };

        this.taskService.downloadFileWithFontSize(taskId, downloadRequest).subscribe(
            (response: any) => {
                let blob: Blob;
                let filename: string;

                if (response.body instanceof Blob) {
                    blob = response.body;
                    filename = this.extractFilenameFromHeaders(response) || 'Таткоммунэнерго.pdf';
                } else {
                    console.error('Unexpected server response:', response);
                    return;
                }

                this.saveBlobAsFile(blob, filename);
                this.closeDownloadSizeModal();
            },
            (error) => {
                console.error('Error downloading file', error);
            }
        );
    } else {
        console.error('Invalid font size or task ID');
    }
    console.log(this.fontSize)
}

  private extractFilenameFromHeaders(response: any): string | null {
    const contentDisposition = response.headers.get('Content-Disposition');

    if (contentDisposition) {
        const match = contentDisposition.match(/filename=["']?([^"']+)/);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
  }

  private saveBlobAsFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  private formatDateToEuropean(date: Date): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }

  private formatDateToISO(dateString: string): string {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }
}
