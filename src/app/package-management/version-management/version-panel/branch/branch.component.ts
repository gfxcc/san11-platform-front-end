import { HttpEventType } from "@angular/common/http";
import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { saveAs } from 'file-saver';
import { Subscription } from "rxjs";
import { TextDialogComponent } from "src/app/common/components/text-dialog/text-dialog.component";
import { GlobalConstants } from "src/app/common/global-constants";
import { NotificationService } from "src/app/common/notification.service";
import { DownloadService } from "src/app/service/download.service";
import { San11PlatformServiceService } from "src/app/service/san11-platform-service.service";
import { getBinaryDisplayName, getBinaryFilename, version2str } from "src/app/utils/binary_util";
import { increment } from "src/app/utils/number_util";
import { signedIn } from "src/app/utils/user_util";
import { Binary, DownloadBinaryRequest, FieldMask, Package, UpdateBinaryRequest } from "src/proto/san11-platform.pb";


export interface Branch {
    name: string;
    binaries: Binary[];
    disabled: boolean;
}
@Component({
    selector: 'branch',
    templateUrl: './branch.html',
    styleUrls: ['./branch.css']
})
export class BranchComponent {
    @Input() package: Package;
    @Input() branch: Branch;
    @Input() editorPermission: boolean;
    @Output() updateDownloadProgress = new EventEmitter();
    @Output() reload = new EventEmitter();
    @ViewChild(MatPaginator) paginator: MatPaginator;

    displayedColumns: string[] = ['version', 'createTime', 'size', 'downloadCount', 'actions'];
    dataSource: MatTableDataSource<Binary>;


    binaryOnDownload: Binary;
    downloadSub: Subscription;
    downloadProgress: number;
    startTime: any;
    endTime: any;
    currTime: any;
    prevTime: any;
    SPEED_UPDATE_DELTA_RATE = 0.2;
    bytesReceied: number = 0;
    oldbytes: number = 0;
    unit: string = "Mbps";
    speed: number = 0;


    constructor(
        private dialog: MatDialog,
        private san11pkService: San11PlatformServiceService,
        private notificationService: NotificationService,
        private downloads: DownloadService,
    ) {
    }

    ngOnInit(): void {
        this.dataSource = new MatTableDataSource(this.branch.binaries);
    }

    ngAfterViewInit() {
        this.dataSource.paginator = this.paginator;
    }

    getVersionStr(binary: Binary): string {
        return version2str(binary.version);
    }


    onDescription(binary: Binary) {
        this.dialog.open(TextDialogComponent, {
            data: {
                title: "????????????",
                content: binary.description,
                editable: this.editorPermission,
            }
        }).afterClosed().subscribe(
            data => {
                if (this.editorPermission && data && data.data != binary.description) {
                    const request = new UpdateBinaryRequest({
                        binary: new Binary({
                            name: binary.name,
                            description: data.data,
                        }),
                        updateMask: new FieldMask({
                            paths: ['description']
                        })
                    });

                    this.san11pkService.updateBinary(request).subscribe(
                        binary => {
                            this.notificationService.success('????????????');
                        },
                        error => {
                            this.notificationService.warn(`????????????: ${error.statusMessage}`)
                        }
                    );
                }
            }
        );
    }

    onDownload(binary: Binary) {
        if (!signedIn()) {
            this.notificationService.warn('?????????');
            return;
        }

        this.downloadProgress = 0;
        this.binaryOnDownload = binary;
        this.san11pkService.downloadBinary(new DownloadBinaryRequest({
            name: this.binaryOnDownload.name
        })).subscribe(
            binary => {
                const fileUrl = GlobalConstants.fileServerUrl + '/' + binary.file.uri;
                const filename = getBinaryFilename(this.package, binary);

                this.prevTime = new Date().getTime();
                this.oldbytes = 0;

                this.downloadSub = this.downloads.download(fileUrl, filename).subscribe(
                    result => {
                        if (result.type === HttpEventType.DownloadProgress) {
                            const percentDone = Math.round(100 * result.loaded / result.total);
                            this.downloadProgress = percentDone;

                            this.bytesReceied = result.loaded / 1000000;
                            this.currTime = new Date().getTime();
                            let speed =
                                (this.bytesReceied - this.oldbytes) /
                                ((this.currTime - this.prevTime) / 1000); // mb/second
                            if (speed < 1) {
                                this.unit = "KB/S";
                                speed *= 1000;
                            } else this.unit = "MB/S";

                            // Use Math.max(this.speed, 1) to handle this.speend == 0
                            if (Math.abs(this.speed - speed) / Math.max(this.speed, 1) > this.SPEED_UPDATE_DELTA_RATE) {
                                this.speed = speed;
                            }
                            this.prevTime = this.currTime;
                            this.oldbytes = this.bytesReceied;

                            this.updateDownloadProgress.emit({
                                progress: percentDone,
                                speed: this.speed,
                                unit: this.unit,
                            });
                        }
                        if (result.type === HttpEventType.Response) {
                            this.updateDownloadProgress.emit({
                                progress: 100,
                                speed: this.speed,
                                unit: this.unit,
                            });

                            this.downloadSub = undefined;
                            const fileDisplayName = getBinaryDisplayName(this.package, binary);
                            saveAs(result.body, fileDisplayName);
                            this.binaryOnDownload.downloadCount = increment(this.binaryOnDownload.downloadCount);
                        }
                    },
                    error => {
                        this.downloadSub = undefined;
                        this.notificationService.warn('????????????: ' + error.name);
                    }
                );
            },
            error => {
                this.notificationService.warn('????????????' + error.statusMessage);
            }
        );
    }

    onDownloadMethod(binary: Binary) {
        this.dialog.open(TextDialogComponent, {
            data: {
                title: '????????????',
                content: binary.downloadMethod
            }
        });
        binary.downloadCount = increment(binary.downloadCount);
        this.san11pkService.downloadBinary(new DownloadBinaryRequest({
            name: binary.name
        })).subscribe();
    }


    onOffload(binary: Binary) {
        if (!confirm('????????? ' + version2str(binary.version) + ' ??????????????????? (????????????????????????????????????)')) {
            return;
        }
        this.san11pkService.updateBinary(new UpdateBinaryRequest({
            binary: new Binary({
                name: binary.name,
            }),
            updateMask: new FieldMask({
                paths: ['file']
            })
        })).subscribe(
            resp => {
                this.notificationService.success('????????????');
                this.reload.emit();
            },
            error => {
                this.notificationService.warn('????????????:' + error.statusMessage);
            }
        );
    }
}
