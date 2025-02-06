import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AllTasksComponent } from './all-tasks/all-tasks.component';
import { WorkComponent } from './work/work.component';
import { ReadyComponent } from './ready/ready.component';

const routes: Routes = [
  {
    path:'all-tasks',
    component:AllTasksComponent,
    title:'Все задачи',
  },
  {
    path:'work',
    component:WorkComponent,
    title:'Задачи в работе',
  },
  {
    path:'ready',
    component:ReadyComponent,
    title:'Готово',
  },
  {
    path:'**',
    component:AllTasksComponent,
    title:'Все задачи'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
