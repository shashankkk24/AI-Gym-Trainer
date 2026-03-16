import math
import numpy as np
from ultralytics import YOLO

# COCO Keypoint Indices
NOSE = 0
LEFT_EYE = 1
RIGHT_EYE = 2
LEFT_EAR = 3
RIGHT_EAR = 4
LEFT_SHOULDER = 5
RIGHT_SHOULDER = 6
LEFT_ELBOW = 7
RIGHT_ELBOW = 8
LEFT_WRIST = 9
RIGHT_WRIST = 10
LEFT_HIP = 11
RIGHT_HIP = 12
LEFT_KNEE = 13
RIGHT_KNEE = 14
LEFT_ANKLE = 15
RIGHT_ANKLE = 16

class PoseTracker:
    def __init__(self, weights_path="backend/weights/yolov8n-pose.pt"):
        try:
            self.model = YOLO(weights_path)
            print("Loaded YOLO weights from", weights_path)
        except Exception as e:
            print(f"Error loading YOLO weights: {e}")
            self.model = None

        self.reset()

    def reset(self):
        self.reps = 0
        self.stage = None
        self.form = "good"
        self.feedback = ""

    def _calculate_angle(self, a, b, c):
        """Calculate angle between 3 points (in degrees). Point b is the vertex."""
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)
        
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)
        
        if angle > 180.0:
            angle = 360 - angle
            
        return angle

    def process_frame(self, frame: np.ndarray, exercise_type: str) -> dict:
        if self.model is None:
            return {
                "reps": self.reps, "stage": self.stage, "form": "error",
                "feedback": "Model not loaded", "keypoints": [], "confidence": 0.0
            }

        results = self.model(frame, verbose=False)
        keypoints = []
        confidence = 0.0

        if not results or not results[0].keypoints or len(results[0].keypoints.xy) == 0:
            return {
                "reps": self.reps, "stage": self.stage, "form": self.form,
                "feedback": "No person detected", "keypoints": [], "confidence": 0.0
            }

        # shape: (1, 17, 2), pick the first person
        kp_array = results[0].keypoints.xy.cpu().numpy()[0]
        conf_array = results[0].keypoints.conf.cpu().numpy()[0]

        keypoints = kp_array.tolist()
        confidence = float(np.mean(conf_array))

        # Perform exercise-specific angle tracking
        self.form = "good"
        self.feedback = ""

        if exercise_type == "squat":
            self._track_squat(kp_array)
        elif exercise_type == "bicep_curl":
            self._track_bicep_curl(kp_array)
        elif exercise_type == "pushup":
            self._track_pushup(kp_array)

        return {
            "reps": self.reps,
            "stage": self.stage,
            "form": self.form,
            "feedback": self.feedback,
            "keypoints": keypoints,
            "confidence": confidence
        }

    def _track_squat(self, kp):
        hip = kp[LEFT_HIP]
        knee = kp[LEFT_KNEE]
        ankle = kp[LEFT_ANKLE]

        if not all(np.any(pt) for pt in (hip, knee, ankle)): return

        angle = self._calculate_angle(hip, knee, ankle)

        # Form check: simplified heuristic based on keypoints 
        # (check if knee goes way past toe using x coordinates, assuming left profile)
        toe_x = kp[LEFT_ANKLE][0]  # rough approx for toe
        knee_x = kp[LEFT_KNEE][0]
        if knee_x < toe_x - 30: # If facing left
           self.form = "fix_form"
           self.feedback = "Knees too far forward"

        if angle > 160:
            self.stage = "up"
        if angle < 100 and self.stage == "up":
            self.stage = "down"
            self.reps += 1
            if angle > 90:
                self.form = "fix_form"
                self.feedback = "Go deeper!"

    def _track_bicep_curl(self, kp):
        shoulder = kp[LEFT_SHOULDER]
        elbow = kp[LEFT_ELBOW]
        wrist = kp[LEFT_WRIST]

        if not all(np.any(pt) for pt in (shoulder, elbow, wrist)): return

        angle = self._calculate_angle(shoulder, elbow, wrist)

        if angle > 160:
            self.stage = "down"
        if angle < 45 and self.stage == "down":
            self.stage = "up"
            self.reps += 1

    def _track_pushup(self, kp):
        shoulder = kp[LEFT_SHOULDER]
        elbow = kp[LEFT_ELBOW]
        wrist = kp[LEFT_WRIST]

        if not all(np.any(pt) for pt in (shoulder, elbow, wrist)): return

        angle = self._calculate_angle(shoulder, elbow, wrist)

        if angle > 160:
            self.stage = "up"
        if angle < 90 and self.stage == "up":
            self.stage = "down"
            self.reps += 1
