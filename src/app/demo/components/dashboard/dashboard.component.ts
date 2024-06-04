import { Component, OnInit, OnDestroy } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Product } from '../../api/product';
import { ProductService } from '../../service/product.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { LayoutService } from 'src/app/layout/service/app.layout.service';
import { AudioRecordingService, RecordedBlob } from '../../service/audio-recording.service';
import { DomSanitizer } from '@angular/platform-browser';
import { WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';
//import { WebcamImage, WebcamInitError, WebcamUtil } from '@cbdev/ngx-webcam';


@Component({
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {

    items!: MenuItem[];

    products!: Product[];

    chartData: any;

    chartOptions: any;

    subscription!: Subscription;

    statusRecord:string = "Stop";

    blobUrl!:any;

    isRecording:boolean = false;

    private recordedBlob!: RecordedBlob;

    startTime:string = "0.00";


    //Manejo de seleccion y cambio de camara
    public mostrarWebCam:boolean = true;
    public permitirCambioWebCam:boolean = true;
    public multiplesWebCam:boolean = false;
    public idWebCam:string = "";
    public optiosnVideo:MediaTrackConstraints = {
        //width:{default:1024},
        //height:{default:576}
    }

    //Control de errores
    public errors: WebcamInitError[] = [];

    //Almacena la ultima foto capturada
    public imagenWebCam!: WebcamImage;

    //Obturador para captura de foto
    public trigger:Subject<void> = new Subject<void>();

    //Cambio de camara
    private sigiuenteWebCam:Subject<boolean | string> = new Subject<boolean | string>

    
  
    

    constructor(private audioRecordingService:AudioRecordingService,
                private sanitizer: DomSanitizer,
                private productService: ProductService, public layoutService: LayoutService) {
                    this.getRecordedBlob();
                    this.audioRecordingService.getRecordingTime().subscribe(data=> this.startTime = data);
                    this.audioRecordingService.getRecordFailed().subscribe(()=> this.isRecording = false);

        this.subscription = this.layoutService.configUpdate$.subscribe(() => {
            this.initChart();
        });
    }

    ngOnInit() {
        this.initChart();
        this.productService.getProductsSmall().then(data => this.products = data);

        this.items = [
            { label: 'Add New', icon: 'pi pi-fw pi-plus' },
            { label: 'Remove', icon: 'pi pi-fw pi-minus' }
        ];

        WebcamUtil.getAvailableVideoInputs()
                 .then((mediaDevices:MediaDeviceInfo[])=>{
                    this.multiplesWebCam = mediaDevices && mediaDevices.length > 1;
                 });

    }

    public triggerCaptura():void{
        this.trigger.next();
    }

    public toggleWebCam():void{
        this.mostrarWebCam = !this.mostrarWebCam;
    }

    public handleInitError(error:WebcamInitError):void{
        this.errors.push(error);
    }

    public showNextWebcam(directionOnDeviceId:boolean|string):void{
        this.sigiuenteWebCam.next(directionOnDeviceId);
    }

    public handleImage(imagenWebCam:WebcamImage):void{
        console.log("Imagen recibida ",imagenWebCam);
        this.imagenWebCam = imagenWebCam;
    }

    public camaraSwitch(idWebCam:string):void{
        console.log("camara activa ",idWebCam);
        this.idWebCam = idWebCam;
    }

    public get triggerObservable():Observable<void>{
        return this.trigger.asObservable();
    }

    public get nextWebcamObservable():Observable<boolean | string>{
        return this.sigiuenteWebCam.asObservable();
    }



    private getRecordedBlob(){
        this.audioRecordingService.getRecordedBlob()
            .subscribe(data=>{
                this.blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(data.blob));
                this.recordedBlob = data;
            })
    }

    grabar(){
        if(!this.isRecording){
            this.isRecording = true;
            this.audioRecordingService.startRecording();
        }
    }

    detener(){
        if(this.isRecording){
            this.isRecording = false;
            this.audioRecordingService.stopRecording();
        }
    }

    descargar(){
        const link = document.createElement('a');
        link.href = URL.createObjectURL(this.recordedBlob.blob);
        link.download = this.recordedBlob.title;
        link.click();
        link.remove();
    }


    eliminar(){
        this.blobUrl = null;
    }

    initChart() {
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
        const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

        this.chartData = {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [
                {
                    label: 'First Dataset',
                    data: [65, 59, 80, 81, 56, 55, 40],
                    fill: false,
                    backgroundColor: documentStyle.getPropertyValue('--bluegray-700'),
                    borderColor: documentStyle.getPropertyValue('--bluegray-700'),
                    tension: .4
                },
                {
                    label: 'Second Dataset',
                    data: [28, 48, 40, 19, 86, 27, 90],
                    fill: false,
                    backgroundColor: documentStyle.getPropertyValue('--green-600'),
                    borderColor: documentStyle.getPropertyValue('--green-600'),
                    tension: .4
                }
            ]
        };

        this.chartOptions = {
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                },
                y: {
                    ticks: {
                        color: textColorSecondary
                    },
                    grid: {
                        color: surfaceBorder,
                        drawBorder: false
                    }
                }
            }
        };
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if(this.isRecording){
            this.isRecording = false;
            this.audioRecordingService.abortRecording()
        }

        
    }

  
}
