#import "AppDelegate.h"
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>
#import <FirebaseCore/FirebaseCore.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"LogisticApp";
  self.dependencyProvider = [RCTAppDependencyProvider new];
  self.initialProps = @{};

  if (![FIRApp defaultApp]) {
    [FIRApp configure];
  }

  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

@end