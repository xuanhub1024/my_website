#import <AVFoundation/AVFoundation.h>
#import <Foundation/Foundation.h>

static void fail(NSString *message) {
    fprintf(stderr, "%s\n", message.UTF8String);
    exit(1);
}

int main(int argc, const char *argv[]) {
    @autoreleasepool {
        if (argc != 3) {
            fprintf(stderr, "Usage: process-life-video <input> <output>\n");
            return 64;
        }

        NSString *inputPath = [NSString stringWithUTF8String:argv[1]];
        NSString *outputPath = [NSString stringWithUTF8String:argv[2]];
        NSURL *inputURL = [NSURL fileURLWithPath:inputPath];
        NSURL *outputURL = [NSURL fileURLWithPath:outputPath];
        AVURLAsset *asset = [AVURLAsset URLAssetWithURL:inputURL options:nil];
        AVAssetTrack *sourceVideoTrack = [asset tracksWithMediaType:AVMediaTypeVideo].firstObject;
        if (!sourceVideoTrack) fail(@"No video track found");

        AVMutableComposition *composition = [AVMutableComposition composition];
        AVMutableCompositionTrack *compositionVideoTrack = [composition
            addMutableTrackWithMediaType:AVMediaTypeVideo
            preferredTrackID:kCMPersistentTrackID_Invalid
        ];
        if (!compositionVideoTrack) fail(@"Could not create composition video track");

        NSError *insertError = nil;
        BOOL inserted = [compositionVideoTrack
            insertTimeRange:CMTimeRangeMake(kCMTimeZero, asset.duration)
            ofTrack:sourceVideoTrack
            atTime:kCMTimeZero
            error:&insertError
        ];
        if (!inserted) fail(insertError.localizedDescription ?: @"Could not insert video track");
        compositionVideoTrack.preferredTransform = sourceVideoTrack.preferredTransform;

        [[NSFileManager defaultManager] removeItemAtURL:outputURL error:nil];
        AVAssetExportSession *exporter = [[AVAssetExportSession alloc]
            initWithAsset:composition
            presetName:AVAssetExportPreset1280x720
        ];
        if (!exporter) fail(@"Could not create export session");

        exporter.outputURL = outputURL;
        exporter.outputFileType = AVFileTypeMPEG4;
        exporter.shouldOptimizeForNetworkUse = YES;

        dispatch_semaphore_t semaphore = dispatch_semaphore_create(0);
        [exporter exportAsynchronouslyWithCompletionHandler:^{
            dispatch_semaphore_signal(semaphore);
        }];

        while (dispatch_semaphore_wait(
            semaphore,
            dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.1 * NSEC_PER_SEC))
        ) != 0) {
            [[NSRunLoop currentRunLoop] runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.05]];
        }

        if (exporter.status != AVAssetExportSessionStatusCompleted) {
            fail(exporter.error.localizedDescription ?: @"Video export failed");
        }

        printf("Created silent H.264 video at %s\n", outputPath.UTF8String);
    }
    return 0;
}
