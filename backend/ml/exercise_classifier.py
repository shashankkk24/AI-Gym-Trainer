import numpy as np

# Same indices mapping as PoseTracker for convenience
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

class ExerciseClassifier:
    def classify(self, keypoints) -> str:
        """
        Takes in a single frame's keypoints [17, 2] and attempts to classify the exercise.
        Rule-based classifier evaluating relative bounding box / joint positions.
        """
        if not keypoints or len(keypoints) < 17:
            return "unknown"

        kp = np.array(keypoints)

        # Basic Checks - Ensure points exist (not [0,0])
        def is_visible(idx):
            return kp[idx][0] != 0 and kp[idx][1] != 0

        # Heuristic 1: If shoulders and wrists are visible, and wrists are above shoulders
        if is_visible(LEFT_SHOULDER) and is_visible(LEFT_WRIST):
            if kp[LEFT_WRIST][1] < kp[LEFT_SHOULDER][1]:
                return "shoulder_press"

        # Heuristic 2: If we see knees and hips, and hips are roughly at or below knee level
        if is_visible(LEFT_HIP) and is_visible(LEFT_KNEE):
            # y is positive downwards
            if abs(kp[LEFT_HIP][1] - kp[LEFT_KNEE][1]) < 30: 
                return "squat"

        # Heuristic 3: Horizontal body (pushup). Shoulders and ankles have roughly same Y
        if is_visible(LEFT_SHOULDER) and is_visible(LEFT_ANKLE):
            if abs(kp[LEFT_SHOULDER][1] - kp[LEFT_ANKLE][1]) < 50:
                return "pushup"

        # Default fallback
        return "unknown"
