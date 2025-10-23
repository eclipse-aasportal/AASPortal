import { Component, Input } from '@angular/core';
import { DocumentationItem } from '../handover-documentation.state';

@Component({
  selector: 'fhg-document-popup',
  imports: [],
  templateUrl: './document-popup.component.html',
  styleUrl: './document-popup.component.scss'
})
export class DocumentPopupComponent {
  @Input() title: string = '';
  @Input() body: DocumentationItem = {
    preview: '',
    title: 'test',
    subtitle: "",
    summary: "",
    organization: "",
    language: "",
    keywords: "",
    version: '',
    status: '',
    statusDate: '',        
    files: []
  };
  @Input() modalId: string = 'customModal';

  public getTitle(){

    if(this.body.title) return this.body.title;

    if(!this.body.files || this.body.files.length <= 0) return "N/A";

    return this.body.files[0].name;
  }

    /**
   * Gets an URL to a preview image for the specified document.
   * @param item The current document item.
   * @returns An URL.
   **/
  public getPreviewSource(item: DocumentationItem): string {
      if (item.preview) {
          return item.preview;
      }

      switch (item.files.at(0)?.extension?.toLowerCase()) {
          case '.pdf':
              return '/assets/resources/file-earmark-pdf.svg';
          case '.doc':
          case '.docx':
              return '/assets/resources/file-earmark-word.svg';
          case '.xls':
          case '.xlsx':
              return '/assets/resources/file-earmark-excel.svg';
          default:
              return '/assets/resources/file-earmark.svg';
      }
  }

    public openFile(){
        if(!this.body) return;
        if(!this.body.files || this.body.files.length <= 0) return;

        window.open(this.body.files[0].url, '_blank');
    }
}
