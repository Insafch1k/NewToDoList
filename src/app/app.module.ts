import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AllTasksComponent } from './all-tasks/all-tasks.component';
import { WorkComponent } from './work/work.component';
import { ReadyComponent } from './ready/ready.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpParams, HttpResponse } from '@angular/common/http';
import { SortTasksPipe } from './sort-tasks.pipe';

@NgModule({
  declarations: [
    AppComponent,
    AllTasksComponent,
    WorkComponent,
    ReadyComponent,
    SortTasksPipe,
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
