import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-generic-table',
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.scss'],
})
export class GenericTableComponent implements OnInit {
  @Input() headers: string[] = [];
  @Input() data: any[] = [];
  @Input() keys: string[] = [];
  @Input() actions: {
    icon: string;
    class: string;
    handler: (row: any) => void;
  }[] = [];
  @Input() loading: boolean = false;

  paginatedData: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  filterText: string = '';

  ngOnInit() {
    this.totalItems = this.data.length;
    this.paginateData();
  }

  paginateData() {
    const filteredData = this.data.filter((row) => {
      return this.keys.some((key) =>
        row[key]
          .toString()
          .toLowerCase()
          .includes(this.filterText.toLowerCase())
      );
    });
    this.totalItems = filteredData.length;
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedData = filteredData.slice(start, end);
  }

  onPageChange(page: number) {
    if (page < 1 || page > Math.ceil(this.totalItems / this.itemsPerPage)) {
      return;
    }
    this.currentPage = page;
    this.paginateData();
  }

  filterData() {
    this.currentPage = 1;
    this.paginateData();
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  getPages(): number[] {
    const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
}
