import { Component, inject } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { GroupService } from './group.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IGroupMember, ITransaction } from '../users/IUser.interface';
import { Chart } from 'chart.js/auto'
import 'chartjs-plugin-datalabels';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ToastrService } from 'ngx-toastr';


import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-add-member',
  template: `
  <div style="margin-bottom: 50px;">
    <h1>Group {{ groupName }}</h1>

    <div id="addMemberAddTransaction">
      <div>
          <form [formGroup]="addMemberForm" (ngSubmit)="addMember()">
            <input type="text" placeholder="email" formControlName="email" /> &nbsp;
            <button type="submit" class="btn btn-primary" id="addMember">AddMember</button>
          </form>
      </div>

        <div style="margin-top: 10px;">
          <button (click)="addTransaction()" class="btn btn-primary">
          <fa-icon [icon]="faPlusCircle"></fa-icon>        
        </button>
        </div>
    </div>

    <div id="forms" [ngStyle]="{'display':'flex','justify-content':'space-around', 'margin':'10px'}">
      <div>
        <h2>Members</h2>
        <span *ngFor="let each of groupMembers">
          <span *ngIf="!each.pending" style="margin: 15px;">{{ each.fullname }},</span>
        </span>
      </div>
      <div>
      <h2>Pending's</h2>
          <div *ngFor="let each of groupMembers">
           <span *ngIf="each.pending"
            style="color: red;"
           >
            {{ each.fullname }}
          </span>
        </div>
      </div>
    </div>

    <h2 *ngIf="perUserTemp.length!==0"> Transactions</h2>

    <div class="container">
    <form [formGroup]="searchForm" *ngIf="perUserTemp.length!==0">
        <input id="search" type="search" placeholder="search" 
       
        formControlName='searchField' (keyup)="handleSearch()">
    </form>
    </div>

    <table *ngIf="perUserTemp.length!==0">
      <thead>
        <tr>
          <th>Title</th>
          <th>Paid by</th>
          <th>Category</th>
          <th>Details</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let each of transactionsList">
            <td>{{ each.title }}</td>
            <td>{{ each.paid_by.fullname }}</td>
            <td>{{ each.category }}</td>

            <td>
              <button (click)="details(each._id)" 
              [ngStyle]="{width:'100%'}"
              class="btn btn-secondary"
              >details</button>
            </td>

        </tr>
      </tbody>
    </table> <br>
    
    <div class="piChartAndTable"> 

      <div class="piChart">
        <canvas  id="MyChart" ></canvas>
      </div>

      <div>
      <table *ngIf="perUserTemp.length!==0">
          <tr>
            <th>Member Name</th>
            <th>Total Paid Amount</th>
            <th> Payable or Receivable </th>
          </tr>
        <tbody>
          <tr *ngFor="let each of perUserTemp">
              <td>{{ each.paid_by.fullname }}</td>
              <td>{{ each.amount }}</td>
              
              <td [ngStyle]="{'background-color':each.amount>totalExpense || each.amount==totalExpense ?'green':''}"  
                *ngIf="each.amount>totalExpense || each.amount==totalExpense" >{{ each.amount - totalExpense }}</td>
              <td *ngIf="each.amount<totalExpense" [ngStyle]="{'background-color':each.amount>totalExpense?'green':'red'}">
                ({{totalExpense - each.amount}})</td>
            
          </tr>
        </tbody>
      </table>
      </div>
      
    </div>

    <a [routerLink]="['', 'users']" 
      [ngStyle]="{display: 'flex',  'justify-content': 'center'}"
      [ngClass]="'inline-gray-button'"
      style="margin: 100px;"
      >back</a>
    
  </div>
  `,
  styles: [],
})
export class ListGroupComponent {
  private groupService = inject(GroupService);
  private activatedRouter = inject(ActivatedRoute);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  faPlusCircle = faPlusCircle;

  groupMembers: IGroupMember[] = []
  addMemberForm = inject(FormBuilder).nonNullable.group({
    email: '',
  });
  searchForm = inject(FormBuilder).nonNullable.group({
    searchField:''
  })
  transactions: ITransaction[] = [];
  transactionsList: ITransaction[] = []

  totalExpense = 0;
  chart: any;

  names: string[] = [];
  many: number[] = [];

  perUserTemp: ITransaction[] = []

  group_id = this.activatedRouter.snapshot.paramMap.get('group_id');
  groupName = this.activatedRouter.snapshot.paramMap.get('groupName');

  handleSearch(){
    let temp: ITransaction [] = this.transactions;
    let text: string = this.searchForm.get('searchField')?.value as string;

    if (text && text.length !== 0) {
        temp = temp.filter((item) =>
         item.paid_by.fullname.toLocaleLowerCase().includes(text.toLocaleLowerCase()) ||
         item.title.toLocaleLowerCase().includes(text.toLocaleLowerCase()) ||
         item.category.toLocaleLowerCase().includes(text.toLocaleLowerCase())
      );
   }
   this.transactionsList = temp;
  }

  addMember() {
    let result = this.groupMembers.find(item => item.email == this.addMemberForm.get('email')?.value)
    if (!result) {
      this.groupService
        .addMember(
          this.addMemberForm.get('email')?.value as string,
          this.group_id as string
        )
        .subscribe((response) => {
          if (response.success) {
            
          this.toastr.success('Request send');

            this.addMemberForm.get('email')?.setValue('');
            this.getMembers();
          } else {
          this.toastr.error(response.data as unknown as string);
          }
        });
    } else {
      this.toastr.error("This user is already in this group!");
    }
  }

  getMembers() {
    this.groupService.getMembers(this.group_id as string).subscribe(
      response => {
        if (response.success) {
          this.groupMembers = response.data;
          this.createChart();
        }
      }
    )
  }

  getTransaction() {
    this.groupService.getTransaction(this.group_id as string).subscribe(
      response => {
        if (response.success) {
          this.transactions = response.data;
          this.transactionsList = response.data;

          for (let all of this.transactions) {
            let found = false;
            for (let each of this.perUserTemp) {
              if (each.paid_by.user_id === all.paid_by.user_id) {
                each.amount += all.amount;
                found = true;
                break;
              }
            }
            if (!found) {
              this.perUserTemp.push(all);
              this.names.push(all.paid_by.fullname);
            }
          }
          
         
          const worker = new Worker(new URL('./group-list.worker.ts', import.meta.url));
          worker.onmessage = ({ data }) => {
            this.totalExpense = data;
          };
          worker.postMessage(this.perUserTemp);


          this.many = this.perUserTemp.map(each => each.amount);
          if (this.chart) {
            this.chart.destroy();
          }
          this.createChart();
        }
      }
    )
  }

  ngAfterViewInit() {
    this.getMembers();
    this.getTransaction();
  }

  addTransaction() {
    this.chart.destroy();
    this.router.navigate(['', 'users', 'group', this.group_id, this.groupName, 'transaction']);
  }

  details(transaction_id: string) {
    this.chart.destroy();
    this.router.navigate(['', 'users', 'group', this.group_id, this.groupName, 'transaction', transaction_id]);
  }

  createChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart("MyChart", {
      type: 'pie',
      data: {
        labels: this.names,
        datasets: [{
          data: this.many,
          backgroundColor: [
            '#9bf723',
            '#077ef5',
            'brown',
            'orange',
            'blue',
            'red',
            'pink',
            'green',
          ],
        }],
      },
      options: {
        plugins: {
          datalabels: {
            color: '#400d0d',
            formatter: (value, context) => {
              const labelIndex = context.dataIndex;
              return this.names[labelIndex];
            },
            anchor: 'end',
            align: 'start',
            font: {
              size: 25,
            },
          },
        },
      },
      plugins: [ChartDataLabels],
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
