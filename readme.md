# Tech Neck Project
Detect and correct “tech-neck” using IMU data or webcam video

## 1. Overall Goal
Automatically detect when a person’s head/neck is tilted downward (i.e. “tech-neck” posture) using only a smartphone’s built-in sensors or a standard webcam, so that end users can be alerted before strain occurs.
Tech-neck, or excessive forward tilting of the head while looking at screens (smartphones, laptops, etc.), has become a widespread ergonomic issue. Prolonged neck flexion can lead to muscle strain, headaches, and long-term spinal misalignment. This project explores two complementary approaches to detect and potentially alert the user when they adopt a harmful neck posture to encourage healthier posture and help prevent strain before it becomes a problem.


## Two Approaches
### Pose Estimate - Tech neck detection using videos 
The goal is to automatically detect “tech-neck” posture on videos. This could be used for:
- Posture monitoring and real-time feedback when people are video recorded
- Dataset creation: generating labeled data for training downstream ML models that might combine both vision and inertial cues.

#### Methodology
We use the MediaPipe Pose (by Google), which offers a real-time TensorFlow Lite model that returns 33 anatomical landmarks (nose, shoulders, hips, knees, etc.) in each frame. It is robust to varying lighting and moderate occlusions, making it suitable for webcam-only posture analysis.

Processing Pipeline: 
For a video where someone is sitting, we convert each frame to RGB, and then fed it through mp_pose.Pose(). This returns a results object containing pose_landmarks.

We have implemented two ways to detect tech neck:
**The pose_estimate_neck.py script** calculates both neck and torso angles, tracks how long ‘bad posture’ persists, and triggers an alert after 180 seconds
From the 33 pose landmarks, we extract the 2D normalized (x,y) coordinates of:
- Left shoulder (keypoint 11)
- Right shoulder (keypoint 12)
- Left ear (keypoint 7)
- Left hip (keypoint 23)

Using these four points, we compute three key metrics:
- Shoulder alignment (offset): we measure the Euclidean distance between the left and right shoulders to check if they remain roughly level

- Neck inclination: we form a 2D vector from the left shoulder to the left ear (in pixel space) and compute its angle relative to the horizontal axis
```math
  \theta_{\text{neck}}
  \;=\;
  \frac{\pi}{180}\,\atan2\!\Bigl(
    y_{L_{\text{ear}}} - y_{L_{\text{shoulder}}},\;
    x_{L_{\text{ear}}} - x_{L_{\text{shoulder}}}
  \Bigr)\,.
```

- Torso inclination: we form a vector from the left hip to the left shoulder and compute its angle
```math
\theta_{\text{torso}}
\;=\;
\frac{\pi}{180}\,\atan2\bigl(
\,y_{L_{\text{shoulder}}} - y_{L_{\text{hip}}},\;
x_{L_{\text{shoulder}}} - x_{L_{\text{hip}}}
\bigr).
```



**The angle_neck.py script** calculates only the neck angle in each frame and displays it

From the 33 landmarks, we specifically extract the 2D normalized (x, y) coordinates of:
- Left shoulder (keypoint 11)
- Right shoulder (keypoint 12)
- Nose (keypoint 0) 
With these landmarks, we average the left-shoulder and right-shoulder coordinates to approximate the midpoint at the top of the torso (base of the neck).


The neck vector is defined as:

```math
  \mathrm{neck\_vector}
  = 
  \bigl(x_{\text{nose}},\,y_{\text{nose}}\bigr)
  - 
  \bigl(
    \tfrac{x_{L_\text{shoulder}} + x_{R_\text{shoulder}}}{2},\;
    \tfrac{y_{L_\text{shoulder}} + y_{R_\text{shoulder}}}{2}
  \bigr).
```
This 2D vector in normalized image space points from the shoulder midpoint to the nose.
atan2(dy, dx) then yields a signed angle (−180° to +180°) between the neck vector and the horizontal “right” direction.
We can then create a threshold for this angle and alerts the user when the angle becomes too big (over 30° for example).


#### Results
This notebook quite reliably computes and displays neck angles for videos and shows proof-of-concept “tech-neck” classification with manual thresholds.
Note: The pipeline has only been ran on two videos, more extensive testing is needed to see if the neck posture detection remains correct accross different sitting positions.



### The Smartphone App
The core idea of this approach is to use a smartphone’s built-in inertial sensors (accelerometer + gyroscope) as “neck-angle tracker.” This would allow anyone with a smartphone to be alerted when they stay too long in a "tech neck" posture, without any additional tools or haedwares needed, just by holding their phone.

We have tried to figure out how to interpret raw (ax, ay, az) and (gx, gy, gz) as a reliable proxy for neck angle, when the phone is in the user’s hand to detect "tech neck".

We use react-native-sensors to sample both accelerometer and gyroscope at 10 Hz (100 ms interval). Data streaming is done through UDP socket, to make sure we have the data in real-time.
So far, each new reading (x, y, z) is:
- Stored in React state (accelData / gyroData) for immediate UI display
- Packaged into a tiny ASCII string ("ACCEL,x,y,z" or "GYRO,x,y,z") and sent via UDP to (serverIP: 6000)

#### How to use the IMU App
1. **Set your IP/Port**  
   - In `App.tsx`, update `serverIP` and `serverPort` to match your desktop’s IP and the UDP port your listener is using (e.g., `5005`).  
   - In `receive_imu.py`, set `UDP_PORT = <same port>`.  
2. **Run the receiver**  
    $ python receive_imu.py
3. **Start the React Native Metro server & install on your device/emulator**
    $ npx react-native start --reset-cache
    $ npm run android
4. **Hold the phone normally**
    See live (ax, ay, az) / (gx, gy, gz) in the UI


#### Results
This pipeline has been tested with an Android simulator but no real phone. It needs to be tested while users move their heads to see if the neck posture detection would be correct.
