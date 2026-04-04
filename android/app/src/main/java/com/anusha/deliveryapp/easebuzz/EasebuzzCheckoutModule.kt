package com.anusha.deliveryapp.easebuzz

import android.app.Activity
import android.content.Intent
import com.easebuzz.payment.kit.PWECheckoutActivity
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = EasebuzzCheckoutModule.NAME)
class EasebuzzCheckoutModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  companion object {
    const val NAME = "EasebuzzCheckout"
    private const val EASEBUZZ_REQUEST_CODE = 4811
    private const val RESULT_NO_DATA = "no_data"
  }

  private var pendingPromise: Promise? = null

  private val activityEventListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?
      ) {
        if (requestCode != EASEBUZZ_REQUEST_CODE) {
          return
        }

        val promise = pendingPromise ?: return
        pendingPromise = null

        val response = Arguments.createMap().apply {
          putString("result", data?.getStringExtra("result") ?: RESULT_NO_DATA)
          putString("paymentResponse", data?.getStringExtra("payment_response"))
        }

        promise.resolve(response)
      }
    }

  init {
    reactApplicationContext.addActivityEventListener(activityEventListener)
  }

  override fun getName(): String = NAME

  @ReactMethod
  fun open(accessKey: String, payMode: String, promise: Promise) {
    val activity = getCurrentActivity()

    when {
      activity == null -> {
        promise.reject("EASEBUZZ_ACTIVITY_MISSING", "Current activity is unavailable.")
        return
      }
      accessKey.isBlank() -> {
        promise.reject("EASEBUZZ_ACCESS_KEY_MISSING", "Easebuzz access key is required.")
        return
      }
      payMode.isBlank() -> {
        promise.reject("EASEBUZZ_PAY_MODE_MISSING", "Easebuzz pay mode is required.")
        return
      }
      pendingPromise != null -> {
        promise.reject("EASEBUZZ_IN_PROGRESS", "An Easebuzz payment is already in progress.")
        return
      }
    }

    pendingPromise = promise

    try {
      val checkoutIntent = Intent(activity, PWECheckoutActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        putExtra("access_key", accessKey)
        putExtra("pay_mode", payMode)
      }

      activity.startActivityForResult(checkoutIntent, EASEBUZZ_REQUEST_CODE)
    } catch (error: Exception) {
      pendingPromise = null
      promise.reject("EASEBUZZ_LAUNCH_FAILED", error.message, error)
    }
  }
}
