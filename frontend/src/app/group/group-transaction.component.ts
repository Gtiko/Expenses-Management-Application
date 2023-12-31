import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { GroupService } from './group.service';

import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-transaction',
  template: `
  <div id="loginSignUp">

   

    <div *ngIf="isLoading" class="loading-indicator">
      <div class="loading-spinner"></div>
    </div>

     <form [formGroup]="transactionForm" (ngSubmit)="submitTransaction()" id="loginForm">
      <h1>Transactions</h1>
        <input type="text" placeholder="title" formControlName="title"> <br>
        <input type="text" placeholder="description" formControlName="description"> <br>
        <input type="text" placeholder="category" formControlName="category"> <br>
        <input type="number" placeholder="amount" formControlName="amount"> <br>
        <input type="date" placeholder="date" formControlName="date"> <br>
        <input type="file"  formControlName="receipt" accept="image/jpg"
          (change)="pickFile($event)"
        > <br> <br>
        <button type="submit" [disabled]="transactionForm.invalid"  class="btn btn-primary">Add Transaction</button>
     
        <a [routerLink]="['', 'users', 'group', group_id, group_name]"
            [ngStyle]="{display: 'flex',  'justify-content': 'center'}"
            [ngClass]="'inline-gray-button'"
            >back
        </a>
      </form>


    
    </div>
  `,
  styles: [
  ]
})
export class TransactionComponent {
  private activatedRouter = inject(ActivatedRoute);
  private groupService = inject(GroupService);
  private toastr = inject(ToastrService);

  receiptFile!: File;
  isLoading: boolean = false; 

  group_id = this.activatedRouter.snapshot.paramMap.get('group_id');
  group_name = this.activatedRouter.snapshot.paramMap.get('groupName');

  transactionForm = inject(FormBuilder).nonNullable.group({
    title: ['', Validators.required],
    description: ['',],
    category: ['', Validators.required],
    amount: ['', Validators.min(0)],
    date: [new Date().toISOString().substring(0, 10)],
    receipt: ['', Validators.required],
  });

  get title() { return this.transactionForm.get('title') as FormControl }
  get description() { return this.transactionForm.get('description') as FormControl }
  get category() { return this.transactionForm.get('category') as FormControl }
  get amount() { return this.transactionForm.get('amount') as FormControl }
  get date() { return this.transactionForm.get('date') as FormControl }
  get receipt() { return this.transactionForm.get('receipt') as FormControl }

  submitTransaction() {
    this.isLoading = true;

    const formData = new FormData();
    formData.append('title', this.title.value);
    formData.append('description', this.description.value);
    formData.append('category', this.category.value);
    formData.append('amount', this.amount.value);
    formData.append('date', this.date.value);
    formData.append('receipt', this.receiptFile);

    this.groupService.addTransaction(this.group_id as string, formData).subscribe(
      response => {
        if (response.success) {

          this.toastr.success("Transaction submitted successfully");

          this.title.setValue('');
          this.description.setValue('');
          this.category.setValue('');
          this.amount.setValue('');
          this.date.setValue('');
          this.receipt.setValue('');
        } else {
          this.toastr.error( "Unable to add transaction!!");
        }
        this.isLoading = false;
      }
    )
  }

  pickFile(event: Event) {
    const input_element = event.target as HTMLInputElement;
    if (input_element.files) {
      this.receiptFile = input_element.files[0];
    }
  }
}
