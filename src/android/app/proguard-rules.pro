# Human Tasks:
# 1. Verify Kotlin Parcelize plugin configuration in app/build.gradle
# 2. Ensure proper SSL certificate pinning configuration in NetworkModule
# 3. Configure proper signing keys for release builds
# 4. Review and adjust optimization passes based on app performance metrics
# 5. Test release builds thoroughly with these ProGuard rules

# ------------------- General Rules -------------------
# Requirements addressed: Security Architecture (5.4)
# Preserve annotations for runtime functionality
-keepattributes *Annotation*
# Keep source file names and line numbers for stack traces
-keepattributes SourceFile,LineNumberTable
# Keep generic type information for proper serialization
-keepattributes Signature
# Keep exception information for error tracking
-keepattributes Exceptions
# Keep enclosing methods for proper stack traces
-keepattributes EnclosingMethod
# Keep InnerClasses for proper functionality
-keepattributes InnerClasses

# ------------------- Domain Models -------------------
# Requirements addressed: Mobile Development (7.2.1)
# Keep all domain model classes
-keep class com.mintreplica.lite.domain.model.** { *; }
# Keep all members of domain model classes
-keepclassmembers class com.mintreplica.lite.domain.model.** { *; }
# Specifically preserve Account model and its members
-keep class com.mintreplica.lite.domain.model.Account {
    java.lang.String id;
    java.math.BigDecimal balance;
    java.lang.String formatBalance();
    <methods>;
}

# ------------------- API Service -------------------
# Requirements addressed: Security Architecture (5.4)
# Keep API interface and its implementations
-keep interface com.mintreplica.lite.data.api.ApiService { *; }
-keepclasseswithmembers class * implements com.mintreplica.lite.data.api.ApiService {
    @retrofit2.http.* <methods>;
}
# Keep API request/response models
-keep class com.mintreplica.lite.data.api.** { *; }

# ------------------- Retrofit Rules -------------------
# Retrofit 2.9.0
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes RuntimeVisibleAnnotations
-keepattributes RuntimeInvisibleAnnotations
-keepclasseswithmembers class * {
    @retrofit2.http.* <methods>;
}
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}

# ------------------- OkHttp Rules -------------------
# OkHttp 4.9.0
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn javax.annotation.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase
-dontwarn org.codehaus.mojo.animal_sniffer.*
-dontwarn okhttp3.internal.platform.ConscryptPlatform

# ------------------- Kotlin Rules -------------------
# Kotlin Serialization 1.5.0
-keep class kotlin.** { *; }
-keep class kotlinx.** { *; }
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
# Keep Kotlin Metadata
-keepattributes *Annotation*, Signature, Exception
-keep class kotlin.Metadata { *; }
# Keep Kotlin Coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-keepclassmembers class kotlinx.coroutines.** {
    volatile <fields>;
}
# Keep Kotlin Parcelize
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# ------------------- Serialization Rules -------------------
# Requirements addressed: Security Architecture (5.4)
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}
-keepclassmembers @kotlinx.serialization.Serializable class ** {
    *** Companion;
    *** INSTANCE;
    kotlinx.serialization.KSerializer serializer(...);
}

# ------------------- Optimization Flags -------------------
# Requirements addressed: Mobile Development (7.2.1)
# Disable arithmetic optimizations for financial calculations
-optimizations !code/simplification/arithmetic
# Disable cast optimizations for type safety
-optimizations !code/simplification/cast
# Set optimization passes
-optimizationpasses 5
# Disable aggressive optimizations
-optimizations !field/*,!class/merging/*,!code/allocation/variable

# ------------------- Shrinking Flags -------------------
# Requirements addressed: Security Architecture (5.4)
# Prevent mixed case class names
-dontusemixedcaseclassnames
# Output detailed optimization info
-verbose
# Don't ignore non-public library classes
-dontskipnonpubliclibraryclasses
# Don't ignore non-public library class members
-dontskipnonpubliclibraryclassmembers
# Preserve line numbers for debugging
-renamesourcefileattribute SourceFile
-keepattributes SourceFile,LineNumberTable

# ------------------- Security Rules -------------------
# Requirements addressed: Security Architecture (5.4)
# Remove logging for release builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
}
# Keep security-related classes
-keep class javax.crypto.** { *; }
-keep class javax.security.** { *; }
-keep class java.security.** { *; }
-keep class java.security.cert.** { *; }