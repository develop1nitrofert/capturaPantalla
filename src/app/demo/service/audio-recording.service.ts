import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Product } from '../api/product';
import { Observable, Subject } from 'rxjs';
import * as recordRTC from 'recordrtc'

export interface RecordedBlob {
    blob: Blob,
    title: string
}

@Injectable()
export class AudioRecordingService {

    private recorder:any;
    private startTime:number = 0;
    private interval:number = 0;
    private stream:MediaStream | null = null;
    
    private recordedBlob = new Subject<RecordedBlob>();
    private recordingTime = new Subject<string>();
    private recordedFailed = new Subject<string>();


    constructor(private http: HttpClient) { }

    startRecording(){
        if(!this.recorder){
            this.recordingTime.next('0:00');
            navigator.mediaDevices.getUserMedia({audio:true, video:true, })
            .then(stream=>{
                this.stream = stream;
                this.record();
            })
            .catch(()=> this.recordedFailed.next(''));
        }
    }

    private record(){
        if(this.stream){
            this.recorder = new recordRTC.MediaStreamRecorder(this.stream,{
            //this.recorder = new recordRTC.StereoAudioRecorder(this.stream,{
                type: 'audio',
                mimeType:'audio/webm'
            });

            this.recorder.record()
        }

        this.startTimer();
    }

    private startTimer(){
        this.interval = setInterval(()=>{
            this.startTime ++;
            this.recordingTime.next(this.timeFormat());
        });
    }

    private timeFormat():string{
        const minutes = Math.floor(this.startTime / 60);
        const seconds = this.startTime - (minutes * 60);
        return `${minutes}:${seconds<10?'0'+seconds:seconds}`;
    }

    stopRecording(){
        if(this.recorder){
            this.recorder.stop((blob:Blob)=>{
                const title = encodeURIComponent('audio_'+new Date().getTime()+'.mp3');
                this.recordedBlob.next({blob, title});
                this.stopMedia();
            },()=>{
               this.stopMedia();
               this.recordedFailed.next(''); 
            })
        }
    }

    private stopMedia(){
        if(this.recorder){
            this.recorder = null;
            clearInterval(this.interval);
            this.startTime = 0;
            if(this.stream){
                this.stream.getAudioTracks().forEach(track => track.stop());
                this.stream = null;
            }
        }
    }

    abortRecording(){
        this.stopMedia();
    }

    getRecordedBlob():Observable<RecordedBlob>{
        return this.recordedBlob.asObservable();

    }

    getRecordingTime():Observable<string>{
        return this.recordingTime.asObservable();
    }

    getRecordFailed():Observable<string>{
        return this.recordedFailed.asObservable();
    }

   
}
