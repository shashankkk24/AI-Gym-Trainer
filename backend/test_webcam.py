import cv2
import numpy as np
from ml.pose_tracker import PoseTracker

def main():
    print("Loading YOLO model...")
    tracker = PoseTracker()
    
    exercises = ['squat', 'pushup', 'bicep_curl']
    current_ex_idx = 0
    exercise_type = exercises[current_ex_idx]
    
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    print("\nWebcam started.")
    print("---------------------------------")
    print("Controls:")
    print("  'q' : Quit")
    print("  'e' : Change Exercise (cycles through squat -> pushup -> bicep_curl)")
    print("  'r' : Reset Rep Counter")
    print("---------------------------------\n")

    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame = cv2.flip(frame, 1)
        result = tracker.process_frame(frame, exercise_type)
        
        reps = result.get('reps', 0)
        stage = result.get('stage', 'N/A')
        form = result.get('form', 'N/A')
        feedback = result.get('feedback', '')
        keypoints = result.get('keypoints', [])
        
        # Display Text
        cv2.putText(frame, f"Exercise: {exercise_type} (Press 'e' to change)", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
        cv2.putText(frame, f"Reps: {reps} (Press 'r' to reset)", (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, f"Stage: {stage}", (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        
        color = (0, 0, 255) if form != "good" else (0, 255, 0)
        cv2.putText(frame, f"Form: {form} {feedback}", (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
        
        # Draw the keypoints lightly
        for pt in keypoints:
            x, y = int(pt[0]), int(pt[1])
            if x != 0 and y != 0:
                cv2.circle(frame, (x, y), 5, (255, 0, 0), -1)

        cv2.imshow('AI Exercise Tracker Test', frame)
        
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == ord('e'):
            current_ex_idx = (current_ex_idx + 1) % len(exercises)
            exercise_type = exercises[current_ex_idx]
            tracker.reset() # Reset reps when changing exercise
            print(f"Switched exercise to: {exercise_type}")
        elif key == ord('r'):
            tracker.reset()
            print(f"Reset rep counter for {exercise_type}")

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
